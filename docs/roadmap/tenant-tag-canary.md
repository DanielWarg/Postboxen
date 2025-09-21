# 🎛️ Kanarystyrning per tenant-tag: Admin UI + Util

## 🔧 Tenant Tag Management Utility

### Core Functions

```typescript
// lib/features/tenant-tags.ts
export interface TenantTag {
  id: string;
  name: string;
  description: string;
  features: string[];
  canaryPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export const TENANT_TAGS = {
  CANARY: 'canary',
  BETA: 'beta',
  EARLY_ADOPTER: 'early-adopter',
  PILOT_A: 'pilot-a',
  PILOT_B: 'pilot-b',
  INTERNAL: 'internal'
} as const;

export function getTenantTags(tenantId: string): string[] {
  // Get tags for a specific tenant
  // This could be from database, environment, or configuration
  const tenantConfig = getTenantConfig(tenantId);
  return tenantConfig?.tags || [];
}

export function getTenantFeatures(tenantId: string): string[] {
  const tags = getTenantTags(tenantId);
  const features: string[] = [];
  
  for (const tag of tags) {
    const tagConfig = getTagConfig(tag);
    features.push(...tagConfig.features);
  }
  
  return [...new Set(features)]; // Remove duplicates
}

export function isFeatureEnabledForTenant(tenantId: string, feature: string): boolean {
  const tenantFeatures = getTenantFeatures(tenantId);
  return tenantFeatures.includes(feature);
}

export function getCanaryPercentage(tenantId: string): number {
  const tags = getTenantTags(tenantId);
  let maxPercentage = 0;
  
  for (const tag of tags) {
    const tagConfig = getTagConfig(tag);
    maxPercentage = Math.max(maxPercentage, tagConfig.canaryPercentage);
  }
  
  return maxPercentage;
}

export function shouldEnableFeatureForTenant(tenantId: string, feature: string): boolean {
  const tenantFeatures = getTenantFeatures(tenantId);
  const canaryPercentage = getCanaryPercentage(tenantId);
  
  // Check if feature is enabled for tenant
  if (!tenantFeatures.includes(feature)) {
    return false;
  }
  
  // Check canary percentage
  const random = Math.random() * 100;
  return random < canaryPercentage;
}
```

### Database Schema

```sql
-- Tenant tags table
CREATE TABLE "TenantTag" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "features" TEXT[] NOT NULL DEFAULT '{}',
  "canaryPercentage" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant tag assignments
CREATE TABLE "TenantTagAssignment" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT NOT NULL,
  FOREIGN KEY ("tagId") REFERENCES "TenantTag"("id") ON DELETE CASCADE
);

-- Feature flags table
CREATE TABLE "FeatureFlag" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎛️ Admin UI för Feature Flags

### Main Admin Panel

```typescript
// app/agents/components/admin/feature-flags-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Zap } from 'lucide-react';

interface TenantTag {
  id: string;
  name: string;
  description: string;
  features: string[];
  canaryPercentage: number;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  createdAt: string;
}

export function FeatureFlagsPanel() {
  const [tenantTags, setTenantTags] = useState<TenantTag[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tagsResponse, flagsResponse] = await Promise.all([
        fetch('/api/admin/tenant-tags'),
        fetch('/api/admin/feature-flags')
      ]);
      
      const tagsData = await tagsResponse.json();
      const flagsData = await flagsResponse.json();
      
      setTenantTags(tagsData.data);
      setFeatureFlags(flagsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantTag = async (tagId: string, updates: Partial<TenantTag>) => {
    try {
      await fetch(`/api/admin/tenant-tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to update tenant tag:', error);
    }
  };

  const toggleFeatureForTag = async (tagId: string, feature: string, enabled: boolean) => {
    const tag = tenantTags.find(t => t.id === tagId);
    if (!tag) return;

    const updatedFeatures = enabled 
      ? [...tag.features, feature]
      : tag.features.filter(f => f !== feature);

    await updateTenantTag(tagId, { features: updatedFeatures });
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await fetch('/api/admin/tenant-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName,
          description: newTagDescription,
          features: [],
          canaryPercentage: 0
        })
      });
      
      setNewTagName('');
      setNewTagDescription('');
      fetchData();
    } catch (error) {
      console.error('Failed to create tenant tag:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Feature Flags per Tenant Tag</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {tenantTags.reduce((sum, tag) => sum + tag.tenantCount, 0)} tenants
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {featureFlags.length} features
          </Badge>
        </div>
      </div>

      {/* Create New Tag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Tenant Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., canary, beta, pilot-a"
              />
            </div>
            <div>
              <Label htmlFor="tag-description">Description</Label>
              <Input
                id="tag-description"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="e.g., Early adopters for testing"
              />
            </div>
          </div>
          <Button onClick={createNewTag} className="mt-4" disabled={!newTagName.trim()}>
            Create Tag
          </Button>
        </CardContent>
      </Card>

      {/* Tenant Tags */}
      {tenantTags.map(tag => (
        <Card key={tag.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tag.name}
                  <Badge variant="secondary">{tag.tenantCount} tenants</Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">{tag.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`canary-${tag.id}`} className="text-sm">Canary:</Label>
                <Input
                  id={`canary-${tag.id}`}
                  type="number"
                  value={tag.canaryPercentage}
                  onChange={(e) => updateTenantTag(tag.id, { 
                    canaryPercentage: parseInt(e.target.value) || 0
                  })}
                  className="w-20"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {featureFlags.map(flag => (
                <div key={flag.id} className="flex items-center gap-2">
                  <Switch
                    checked={tag.features.includes(flag.id)}
                    onCheckedChange={(checked) => 
                      toggleFeatureForTag(tag.id, flag.id, checked)
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{flag.name}</span>
                    <p className="text-xs text-gray-500">{flag.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Admin Dashboard Integration

```typescript
// app/agents/components/admin/admin-dashboard.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureFlagsPanel } from './feature-flags-panel';
import { TenantManagementPanel } from './tenant-management-panel';
import { MetricsPanel } from './metrics-panel';
import { Settings, Users, BarChart3 } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="feature-flags" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feature-flags" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="feature-flags">
          <FeatureFlagsPanel />
        </TabsContent>
        
        <TabsContent value="tenants">
          <TenantManagementPanel />
        </TabsContent>
        
        <TabsContent value="metrics">
          <MetricsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 🔧 API Endpoints för Tenant Tag Management

### Tenant Tags API

```typescript
// app/api/admin/tenant-tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { ApiError } from '@/lib/http/errors';
import { createLogger } from '@/lib/observability/logger';

export async function GET(request: NextRequest) {
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined);
  
  try {
    await authenticateRequest(request, ['admin:read']);
    
    const tenantTags = await getTenantTags();
    logger.info('Tenant tags fetched', { count: tenantTags.length });
    
    return NextResponse.json({ success: true, data: tenantTags });
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to fetch tenant tags', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    logger.error('Tenant tags error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined);
  
  try {
    await authenticateRequest(request, ['admin:write']);
    
    const body = await request.json();
    const newTag = await createTenantTag(body);
    
    logger.info('Tenant tag created', { tagId: newTag.id, name: newTag.name });
    
    return NextResponse.json({ success: true, data: newTag }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to create tenant tag', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    logger.error('Create tenant tag error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Individual Tenant Tag API

```typescript
// app/api/admin/tenant-tags/[tagId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { ApiError } from '@/lib/http/errors';
import { createLogger } from '@/lib/observability/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined);
  
  try {
    await authenticateRequest(request, ['admin:write']);
    
    const body = await request.json();
    const updatedTag = await updateTenantTag(params.tagId, body);
    
    logger.info('Tenant tag updated', { tagId: params.tagId, updates: body });
    
    return NextResponse.json({ success: true, data: updatedTag });
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to update tenant tag', { error: error.message, tagId: params.tagId });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    logger.error('Update tenant tag error', { error: error instanceof Error ? error.message : 'Unknown error', tagId: params.tagId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const logger = createLogger(request.headers.get('x-correlation-id') || undefined);
  
  try {
    await authenticateRequest(request, ['admin:write']);
    
    await deleteTenantTag(params.tagId);
    
    logger.info('Tenant tag deleted', { tagId: params.tagId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn('Failed to delete tenant tag', { error: error.message, tagId: params.tagId });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    logger.error('Delete tenant tag error', { error: error instanceof Error ? error.message : 'Unknown error', tagId: params.tagId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 🎯 Usage Examples

### Check Feature for Tenant

```typescript
// In your application code
import { isFeatureEnabledForTenant, shouldEnableFeatureForTenant } from '@/lib/features/tenant-tags';

// Check if feature is enabled for tenant
if (isFeatureEnabledForTenant(tenantId, 'FEATURE_DECISION_CLOSE_CARD')) {
  // Show Decision Close Card
}

// Check if feature should be enabled (considering canary percentage)
if (shouldEnableFeatureForTenant(tenantId, 'FEATURE_MODEL_ROUTER')) {
  // Use new model router
} else {
  // Use old model router
}
```

### Admin Commands

```bash
# Create a new tenant tag
curl -X POST http://localhost:3000/api/admin/tenant-tags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pilot-a",
    "description": "SMB pilot customers",
    "features": ["FEATURE_DECISION_CLOSE_CARD", "FEATURE_MODEL_ROUTER"],
    "canaryPercentage": 100
  }'

# Update canary percentage
curl -X PATCH http://localhost:3000/api/admin/tenant-tags/pilot-a \
  -H "Content-Type: application/json" \
  -d '{"canaryPercentage": 50}'

# Toggle feature for tag
curl -X PATCH http://localhost:3000/api/admin/tenant-tags/pilot-a \
  -H "Content-Type: application/json" \
  -d '{"features": ["FEATURE_DECISION_CLOSE_CARD", "FEATURE_MODEL_ROUTER", "FEATURE_DOC_COPILOT_V1"]}'
```

---

**Denna kanarystyrning gör det enkelt att rulla ut/av features tenant-för-tenant!** 🚀
