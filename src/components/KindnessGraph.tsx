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
  createdAt: number;
}

export default function IgniteGraph({ data, currentUserId, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { width, height } = dimensions;

    const defs = svg.append("defs");
    const glow = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "coloredBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const bgGrad = defs.append("radialGradient").attr("id", "bg-gradient").attr("cx", "50%").attr("cy", "50%").attr("r", "60%");
    bgGrad.append("stop").attr("offset", "0%").attr("stop-color", "#1a1035");
    bgGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0a0a1a");

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#bg-gradient)");

    // Stars
    const particleGroup = svg.append("g");
    for (let i = 0; i < 30; i++) {
      particleGroup.append("circle")
        .attr("cx", Math.random() * width).attr("cy", Math.random() * height)
        .attr("r", Math.random() * 1.5 + 0.5).attr("fill", "#fff").attr("opacity", Math.random() * 0.3 + 0.1);
    }

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85));

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n, x: undefined, y: undefined }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = data.links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({ source: l.source, target: l.target, amount: l.amount, createdAt: l.createdAt }));

    const sizeScale = d3.scaleSqrt()
      .domain([0, Math.max(...nodes.map((n) => n.totalActivity), 1)])
      .range([10, 32]);

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(90).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => sizeScale(d.totalActivity) + 5))
      .alphaDecay(0.02);

    const linkElements = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", (d) => `rgba(255, 140, 66, ${Math.min(0.3 + d.amount * 0.15, 0.8)})`)
      .attr("stroke-width", (d) => Math.min(1 + d.amount * 0.8, 4))
      .attr("filter", "url(#glow)");

    // Animated particles along links
    links.forEach((link, i) => {
      for (let p = 0; p < Math.min(link.amount, 2); p++) {
        const particle = g.append("circle").attr("r", 2).attr("fill", "#FFD700").attr("opacity", 0.8).attr("filter", "url(#glow)");
        const animate = () => {
          const s = link.source as SimNode, t = link.target as SimNode;
          if (s.x == null || t.x == null) return;
          particle.attr("cx", s.x!).attr("cy", s.y!)
            .transition().duration(2000 + Math.random() * 1000).delay(p * 700 + i * 200).ease(d3.easeLinear)
            .attr("cx", t.x!).attr("cy", t.y!)
            .transition().duration(0).on("end", animate);
        };
        setTimeout(animate, 1000 + i * 100);
      }
    });

    const nodeElements = g.append("g").selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .on("click", (_, d) => { if (onNodeClick) onNodeClick(d.id); })
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );

    // Glow ring
    nodeElements.append("circle")
      .attr("r", (d) => sizeScale(d.totalActivity) + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => d.type === "spark" ? (d.status === "ignited" ? "#FF8C42" : "#7B61FF") : (d.id === currentUserId ? "#FFD700" : "#00D4AA"))
      .attr("stroke-width", (d) => d.id === currentUserId ? 3 : 1.5)
      .attr("opacity", 0.4).attr("filter", "url(#glow)");

    // Main circle
    nodeElements.append("circle")
      .attr("r", (d) => sizeScale(d.totalActivity))
      .attr("fill", (d) => d.type === "spark" ? (d.status === "ignited" ? "#FF8C42" : "#7B61FF") : "#00D4AA")
      .attr("opacity", 0.9).attr("filter", "url(#glow)")
      .attr("stroke", (d) => d.id === currentUserId ? "#FFD700" : "rgba(255,255,255,0.2)")
      .attr("stroke-width", (d) => d.id === currentUserId ? 2 : 1);

    // Labels
    nodeElements.append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle").attr("dy", (d) => sizeScale(d.totalActivity) + 16)
      .attr("fill", "rgba(255,255,255,0.85)").attr("font-size", "10px").attr("font-weight", "500").attr("pointer-events", "none");

    // "You" label
    nodeElements.filter((d) => d.id === currentUserId).append("text")
      .text("You").attr("text-anchor", "middle").attr("dy", (d) => sizeScale(d.totalActivity) + 28)
      .attr("fill", "#FFD700").attr("font-size", "9px").attr("font-weight", "700").attr("pointer-events", "none");

    simulation.on("tick", () => {
      linkElements.attr("x1", (d) => (d.source as SimNode).x!).attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!).attr("y2", (d) => (d.target as SimNode).y!);
      nodeElements.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [data, currentUserId, onNodeClick, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px]">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="rounded-2xl" />
      {data && data.nodes.length > 0 && (
        <div className="absolute bottom-3 left-3 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-white/50 space-y-1">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "#7B61FF" }} /> Active Spark</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "#FF8C42" }} /> Ignited</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "#00D4AA" }} /> Backer</div>
        </div>
      )}
      {(!data || data.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/40">
            <div className="text-4xl mb-3">🌱</div>
            <div className="text-sm">No sparks yet. Create one!</div>
          </div>
        </div>
      )}
    </div>
  );
}
