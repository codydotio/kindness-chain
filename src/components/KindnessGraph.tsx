"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ChainData, ChainNode, ChainLink } from "@/lib/types";

interface Props {
  data: ChainData | null;
  currentUserId?: string;
  onNodeClick?: (nodeId: string) => void;
}

interface SimNode extends ChainNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  amount: number;
  note: string;
  createdAt: number;
}

export default function KindnessGraph({
  data,
  currentUserId,
  onNodeClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    note: string;
    from: string;
    to: string;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create defs for gradients and filters
    const defs = svg.append("defs");

    // Glow filter
    const glow = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const glowMerge = glow.append("feMerge");
    glowMerge.append("feMergeNode").attr("in", "coloredBlur");
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Softer glow for links
    const linkGlow = defs
      .append("filter")
      .attr("id", "link-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    linkGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");
    const linkGlowMerge = linkGlow.append("feMerge");
    linkGlowMerge.append("feMergeNode").attr("in", "coloredBlur");
    linkGlowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Radial gradient for background
    const bgGrad = defs
      .append("radialGradient")
      .attr("id", "bg-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "60%");
    bgGrad.append("stop").attr("offset", "0%").attr("stop-color", "#1a1035");
    bgGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0a0a1a");

    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#bg-gradient)");

    // Animated background particles (stars)
    const particleGroup = svg.append("g").attr("class", "particles");
    for (let i = 0; i < 40; i++) {
      particleGroup
        .append("circle")
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 1.5 + 0.5)
        .attr("fill", "#ffffff")
        .attr("opacity", Math.random() * 0.3 + 0.1)
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("values", `${Math.random() * 0.2 + 0.1};${Math.random() * 0.5 + 0.3};${Math.random() * 0.2 + 0.1}`)
        .attr("dur", `${Math.random() * 3 + 2}s`)
        .attr("repeatCount", "indefinite");
    }

    // Create zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Center the view
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9)
    );

    // Prepare data
    const nodes: SimNode[] = data.nodes.map((n) => ({
      ...n,
      x: undefined,
      y: undefined,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = data.links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        amount: l.amount,
        note: l.note,
        createdAt: l.createdAt,
      }));

    // Color scale — warmer = more kindness
    const maxKindness = Math.max(
      ...nodes.map((n) => n.kindnessGiven + n.kindnessReceived),
      1
    );
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, maxKindness * 0.3, maxKindness * 0.7, maxKindness])
      .range(["#7B61FF", "#00D4AA", "#FFD700", "#FF4B6E"])
      .clamp(true);

    // Size scale
    const sizeScale = d3
      .scaleSqrt()
      .domain([0, Math.max(...nodes.map((n) => n.totalGifts), 1)])
      .range([8, 28]);

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => sizeScale(d.totalGifts) + 5))
      .alphaDecay(0.02);

    // Draw links
    const linkGroup = g.append("g").attr("class", "links");

    const linkElements = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        const opacity = Math.min(0.3 + d.amount * 0.15, 0.8);
        return `rgba(255, 215, 0, ${opacity})`;
      })
      .attr("stroke-width", (d) => Math.min(1 + d.amount * 0.8, 4))
      .attr("filter", "url(#link-glow)")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        const sourceNode = d.source as SimNode;
        const targetNode = d.target as SimNode;
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          note: d.note,
          from: sourceNode.name,
          to: targetNode.name,
        });
      })
      .on("mouseleave", () => setTooltip(null));

    // Animated particles along links (kindness flowing)
    links.forEach((link, i) => {
      const particleCount = Math.min(link.amount, 3);
      for (let p = 0; p < particleCount; p++) {
        const particle = linkGroup
          .append("circle")
          .attr("r", 2)
          .attr("fill", "#FFD700")
          .attr("opacity", 0.8)
          .attr("filter", "url(#glow)");

        const animateParticle = () => {
          const source = link.source as SimNode;
          const target = link.target as SimNode;
          if (source.x == null || target.x == null) return;

          particle
            .attr("cx", source.x ?? 0)
            .attr("cy", source.y ?? 0)
            .transition()
            .duration(2000 + Math.random() * 1000)
            .delay(p * 700 + i * 200)
            .ease(d3.easeLinear)
            .attr("cx", target.x ?? 0)
            .attr("cy", target.y ?? 0)
            .transition()
            .duration(0)
            .on("end", animateParticle);
        };

        // Start animation after simulation settles a bit
        setTimeout(animateParticle, 1000 + i * 100);
      }
    });

    // Draw nodes
    const nodeGroup = g.append("g").attr("class", "nodes");

    const nodeElements = nodeGroup
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (onNodeClick) onNodeClick(d.id);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node outer glow ring
    nodeElements
      .append("circle")
      .attr("r", (d) => sizeScale(d.totalGifts) + 4)
      .attr("fill", "none")
      .attr("stroke", (d) =>
        d.id === currentUserId
          ? "#FFD700"
          : colorScale(d.kindnessGiven + d.kindnessReceived)
      )
      .attr("stroke-width", (d) => (d.id === currentUserId ? 3 : 1.5))
      .attr("opacity", 0.4)
      .attr("filter", "url(#glow)");

    // Node main circle
    nodeElements
      .append("circle")
      .attr("r", (d) => sizeScale(d.totalGifts))
      .attr("fill", (d) =>
        colorScale(d.kindnessGiven + d.kindnessReceived)
      )
      .attr("opacity", 0.9)
      .attr("filter", "url(#glow)")
      .attr("stroke", (d) =>
        d.id === currentUserId ? "#FFD700" : "rgba(255,255,255,0.2)"
      )
      .attr("stroke-width", (d) => (d.id === currentUserId ? 2 : 1));

    // Node inner light
    nodeElements
      .append("circle")
      .attr("r", (d) => sizeScale(d.totalGifts) * 0.3)
      .attr("fill", "rgba(255,255,255,0.3)")
      .attr("cy", (d) => -sizeScale(d.totalGifts) * 0.15);

    // Node labels
    nodeElements
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => sizeScale(d.totalGifts) + 16)
      .attr("fill", "rgba(255, 255, 255, 0.85)")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("font-family", "system-ui, sans-serif")
      .attr("pointer-events", "none");

    // Current user label highlight
    nodeElements
      .filter((d) => d.id === currentUserId)
      .append("text")
      .text("You")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => sizeScale(d.totalGifts) + 28)
      .attr("fill", "#FFD700")
      .attr("font-size", "9px")
      .attr("font-weight", "700")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "1px")
      .attr("pointer-events", "none");

    // Simulation tick
    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeElements.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, currentUserId, onNodeClick, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px]">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-2xl"
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 max-w-[250px] px-4 py-3 rounded-xl bg-black/90 backdrop-blur-sm border border-kindness-glow/30 shadow-lg shadow-kindness-glow/10 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div className="text-xs text-kindness-glow/70 mb-1">
            {tooltip.from} → {tooltip.to}
          </div>
          <div className="text-sm text-white/90 italic leading-snug">
            &ldquo;{tooltip.note}&rdquo;
          </div>
        </div>
      )}

      {/* Legend */}
      {data && data.nodes.length > 0 && (
        <div className="absolute bottom-3 left-3 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-white/50 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#7B61FF" }}
            />
            New to the chain
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#FFD700" }}
            />
            Active giver
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#FF4B6E" }}
            />
            Kindness hub
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!data || data.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/40">
            <div className="text-4xl mb-3">🌱</div>
            <div className="text-sm">The kindness chain is empty.</div>
            <div className="text-xs mt-1">Be the first to plant a seed.</div>
          </div>
        </div>
      )}
    </div>
  );
}
