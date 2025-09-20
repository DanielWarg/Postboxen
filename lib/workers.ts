// Start job workers when the application starts
import { startWorkers } from "@/lib/queues"

// Only start workers in server environment
if (typeof window === "undefined") {
  startWorkers()
}
