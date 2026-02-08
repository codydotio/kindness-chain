import { subscribe } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      // Subscribe to store events
      const unsubscribe = subscribe((event, data) => {
        try {
          const payload = JSON.stringify({ type: event, data });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream closed
          unsubscribe();
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup when stream closes
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // Handle abort
      if (typeof AbortSignal !== "undefined") {
        // The stream will be closed by the client
        setTimeout(() => {
          // Keep alive for 5 minutes max
        }, 300000);
      }

      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
