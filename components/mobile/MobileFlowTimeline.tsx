"use client";

import { useState, useEffect } from "react";
import { 
  Home, 
  LogIn, 
  LayoutDashboard, 
  Settings, 
  User, 
  ShoppingCart,
  CreditCard,
  FileText,
  Bell,
  Search,
  Menu,
  MessageSquare,
  Image,
  Play,
  Loader2,
  ChevronRight,
  Eye,
  MousePointer,
  Sparkles
} from "lucide-react";

// Flow node type from desktop
interface FlowNode {
  id: string;
  name: string;
  type: "view" | "section" | "modal" | "state" | "loading";
  description?: string;
  status: "observed" | "detected" | "inferred" | "possible" | "added";
  confidence: "high" | "medium" | "low";
  components?: string[];
  thumbnail?: string;
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: "navigation" | "action" | "scroll" | "gated" | "possible" | "hover";
}

interface MobileFlowTimelineProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeSelect?: (node: FlowNode) => void;
  selectedNodeId?: string | null;
  isLoading?: boolean;
}

// Map node names to icons
const getNodeIcon = (name: string, type: string) => {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("home") || nameLower.includes("landing")) return Home;
  if (nameLower.includes("login") || nameLower.includes("sign")) return LogIn;
  if (nameLower.includes("dashboard")) return LayoutDashboard;
  if (nameLower.includes("settings") || nameLower.includes("config")) return Settings;
  if (nameLower.includes("profile") || nameLower.includes("account") || nameLower.includes("user")) return User;
  if (nameLower.includes("cart") || nameLower.includes("basket")) return ShoppingCart;
  if (nameLower.includes("payment") || nameLower.includes("checkout")) return CreditCard;
  if (nameLower.includes("document") || nameLower.includes("file") || nameLower.includes("page")) return FileText;
  if (nameLower.includes("notification") || nameLower.includes("alert")) return Bell;
  if (nameLower.includes("search")) return Search;
  if (nameLower.includes("menu") || nameLower.includes("nav")) return Menu;
  if (nameLower.includes("chat") || nameLower.includes("message")) return MessageSquare;
  if (nameLower.includes("image") || nameLower.includes("gallery") || nameLower.includes("photo")) return Image;
  if (nameLower.includes("video") || nameLower.includes("media")) return Play;
  
  // Default based on type
  if (type === "modal") return MessageSquare;
  if (type === "loading") return Loader2;
  
  return LayoutDashboard;
};

// Get status styling
const getStatusStyle = (status: string) => {
  switch (status) {
    case "observed":
    case "added":
      return {
        lineStyle: "border-solid border-emerald-500",
        dotStyle: "bg-emerald-500",
        labelStyle: "text-emerald-400",
        label: "Observed",
      };
    case "detected":
      return {
        lineStyle: "border-dashed border-amber-500",
        dotStyle: "bg-amber-500",
        labelStyle: "text-amber-400",
        label: "Detected",
      };
    case "inferred":
    case "possible":
      return {
        lineStyle: "border-dotted border-zinc-500",
        dotStyle: "bg-zinc-500",
        labelStyle: "text-zinc-400",
        label: "Suggested",
      };
    default:
      return {
        lineStyle: "border-solid border-zinc-600",
        dotStyle: "bg-zinc-600",
        labelStyle: "text-zinc-400",
        label: "",
      };
  }
};

export default function MobileFlowTimeline({
  nodes,
  edges,
  onNodeSelect,
  selectedNodeId,
  isLoading = false,
}: MobileFlowTimelineProps) {
  // Sort nodes by status priority (observed first, then detected, then inferred)
  const sortedNodes = [...nodes].sort((a, b) => {
    const statusOrder = { observed: 0, added: 0, detected: 1, inferred: 2, possible: 2 };
    return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
  });

  // Group nodes by status
  const observedNodes = sortedNodes.filter(n => n.status === "observed" || n.status === "added");
  const detectedNodes = sortedNodes.filter(n => n.status === "detected");
  const suggestedNodes = sortedNodes.filter(n => n.status === "inferred" || n.status === "possible");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
          <p className="text-white/50 text-sm">Loading flow...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#FF6E3C]/50 mx-auto mb-3" />
          <h3 className="text-white font-medium mb-2">No flow data</h3>
          <p className="text-white/50 text-sm">
            Generate a project to see the user journey
          </p>
        </div>
      </div>
    );
  }

  const renderNodeGroup = (groupNodes: FlowNode[], title: string, showLine: boolean = true) => {
    if (groupNodes.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 px-4">
          {title}
        </h3>
        <div className="relative">
          {groupNodes.map((node, index) => {
            const Icon = getNodeIcon(node.name, node.type);
            const statusStyle = getStatusStyle(node.status);
            const isSelected = selectedNodeId === node.id;
            const isLast = index === groupNodes.length - 1;

            // Find edges from this node
            const outgoingEdges = edges.filter(e => e.from === node.id);

            return (
              <div key={node.id} className="relative">
                {/* Connecting line (except for last item) */}
                {showLine && !isLast && (
                  <div 
                    className={`absolute left-[30px] top-[56px] w-0 h-[calc(100%-16px)] border-l-2 ${statusStyle.lineStyle}`}
                  />
                )}

                {/* Node card */}
                <button
                  onClick={() => onNodeSelect?.(node)}
                  className={`w-full px-4 py-3 flex items-start gap-4 transition-colors ${
                    isSelected 
                      ? "bg-[#FF6E3C]/10" 
                      : "hover:bg-white/5 active:bg-white/10"
                  }`}
                >
                  {/* Status dot and icon */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-[#FF6E3C]/20" : "bg-white/5"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? "text-[#FF6E3C]" : "text-white/60"
                      }`} />
                    </div>
                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${statusStyle.dotStyle}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium truncate ${
                        isSelected ? "text-white" : "text-white/90"
                      }`}>
                        {node.name}
                      </h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle.labelStyle} bg-white/5`}>
                        {node.type}
                      </span>
                    </div>
                    
                    {node.description && (
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-1">
                        {node.description}
                      </p>
                    )}

                    {/* Outgoing connections */}
                    {outgoingEdges.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {outgoingEdges.slice(0, 3).map(edge => (
                          <span 
                            key={edge.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 flex items-center gap-1"
                          >
                            <ChevronRight className="w-2.5 h-2.5" />
                            {edge.label || "Navigate"}
                          </span>
                        ))}
                        {outgoingEdges.length > 3 && (
                          <span className="text-[10px] text-white/30">
                            +{outgoingEdges.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Components count */}
                    {node.components && node.components.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-white/30">
                          {node.components.length} components
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                    isSelected ? "text-[#FF6E3C]" : "text-white/20"
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">User Journey</h2>
        <p className="text-white/40 text-xs mt-0.5">
          {nodes.length} screens detected
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Observed screens - solid line */}
        {renderNodeGroup(observedNodes, `Observed (${observedNodes.length})`)}
        
        {/* Detected screens - dashed line */}
        {renderNodeGroup(detectedNodes, `Detected (${detectedNodes.length})`)}
        
        {/* Suggested screens - dotted line */}
        {renderNodeGroup(suggestedNodes, `Suggested (${suggestedNodes.length})`)}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-white/40">Observed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-white/40">Detected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-[10px] text-white/40">Suggested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
