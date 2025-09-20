import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function RegwatchLoading() {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-3 rounded-md border border-border/60 bg-card/60 p-4 md:grid-cols-4">
          <Skeleton className="h-12 w-full md:col-span-2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="flex items-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item} className="border-border/60 bg-card/60">
            <CardHeader className="space-y-2">
              <CardTitle>
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-3 w-36" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator className="bg-border/80" />

      <div className="grid gap-4">
        {[0, 1].map((item) => (
          <Card key={item} className="border-border/60 bg-card/60">
            <CardHeader className="space-y-2">
              <CardTitle>
                <Skeleton className="h-4 w-48" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-3 w-40" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[0, 1, 2].map((line) => (
                <Skeleton key={line} className="h-3 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
