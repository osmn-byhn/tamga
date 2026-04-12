import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Key, Terminal, ArrowLeft, ZoomIn, ZoomOut, Maximize2, RefreshCw, ShieldAlert } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const COLUMN_SPACING = 300;
const ROW_SPACING = 120;

const GraphView = () => {
    const { getAllVaultItems } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [dragStartNode, setDragStartNode] = useState(null); // { id, type, x, y, port: 'left' | 'right' }
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const nodeRefs = useRef({});
    const containerRef = useRef(null);
    const { toggleLink } = useAuth();

    const loadData = async () => {
        setLoading(true);
        const all = await getAllVaultItems();
        setItems(all);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Zoom shortcuts and scroll handling
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(z => Math.min(2, Math.max(0.3, z + delta)));
            }
        };

        const handleKeyDown = (e) => {
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    setZoom(z => Math.min(2, z + 0.1));
                } else if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    setZoom(z => Math.max(0.3, z - 0.1));
                } else if (e.key === '0') {
                    e.preventDefault();
                    setZoom(1);
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [zoom]); // Add zoom if we needed precise calculations, but here we use functional updates. Actually, zoom isn't strictly needed in deps if using functional setZoom, but let's keep it safe. Wait, functional update is better.

    const categories = [
        { id: 'password', name: 'Passwords', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'otp', name: 'OTPs', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'passkey', name: 'Passkeys', icon: Key, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'recovery', name: 'Recovery', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'env', name: 'Envs', icon: Terminal, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    const getItemLabel = (item) => {
        if (!item) return "";
        switch (item.type) {
            case 'password': return item.platform || "Untitled";
            case 'env': return typeof item.projectName === 'object' ? item.projectName.projectName : (item.projectName || "Untitled");
            case 'passkey': return item.label || "Passkey";
            case 'otp': 
                try {
                    const uriPart = item.uri.split('?')[0].split('/').pop();
                    return decodeURIComponent(uriPart.includes(':') ? uriPart.split(':')[1] : uriPart) || "OTP";
                } catch(e) { return "OTP"; }
            default: return "Item";
        }
    };

    // Calculate positions
    const itemsByColumn = useMemo(() => {
        const grouped = {};
        categories.forEach(cat => {
            grouped[cat.id] = items.filter(i => i.type === cat.id);
        });
        return grouped;
    }, [items]);

    const positions = useMemo(() => {
        const pos = {};
        categories.forEach((cat, colIdx) => {
            const colItems = itemsByColumn[cat.id];
            colItems.forEach((item, rowIdx) => {
                pos[`${item.type}-${item.id}`] = {
                    x: colIdx * COLUMN_SPACING + 50,
                    y: rowIdx * ROW_SPACING + 100,
                    type: item.type,
                    id: item.id
                };
            });
        });
        return pos;
    }, [itemsByColumn]);

    // Draw links
    const links = useMemo(() => {
        const lines = [];
        items.forEach(item => {
            const fromKey = `${item.type}-${item.id}`;
            const fromPos = positions[fromKey];
            if (!fromPos) return;

            (item.links || []).forEach(link => {
                const toKey = `${link.type}-${link.id}`;
                const toPos = positions[toKey];
                if (!toPos) return;

                // Avoid duplicate lines for bi-directional (only draw from left to right or if type order is same, by ID)
                // Actually, let's just draw all but with lower opacity?
                // For a flowchart, one line is enough.
                const lineKey = [fromKey, toKey].sort().join('::');
                if (!lines.find(l => l.key === lineKey)) {
                    lines.push({
                        key: lineKey,
                        from: fromPos,
                        to: toPos,
                        fromId: fromKey,
                        toId: toKey
                    });
                }
            });
        });
        return lines;
    }, [items, positions]);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading connection graph...</div>;

    const isRelated = (nodeKey) => {
        if (!selectedId && !hoveredId) return true;
        const activeId = hoveredId || selectedId;
        if (nodeKey === activeId) return true;
        
        const activeItem = items.find(i => `${i.type}-${i.id}` === activeId);
        if (!activeItem) return false;

        return activeItem.links?.some(l => `${l.type}-${l.id}` === nodeKey);
    };

    const isLinkActive = (fromId, toId) => {
        const activeId = hoveredId || selectedId;
        if (!activeId) return true;
        return fromId === activeId || toId === activeId;
    };

    return (
        <div className="h-full w-full bg-background overflow-hidden flex flex-col">
            <header className="p-4 border-b flex items-center justify-between bg-card z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
                        Security Connection Graph
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/50 rounded-lg px-3 py-1 mr-4 border border-border">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Drag dots to connect items</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                    <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => setZoom(1)}><Maximize2 className="h-4 w-4" /></Button>
                </div>
            </header>

            <div 
                ref={containerRef}
                className="flex-1 relative overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]"
                onMouseMove={(e) => {
                    if (!dragStartNode) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    // Accurate cursor tracking within the scaled canvas
                    const x = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
                    const y = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;
                    setMousePos({ x, y });
                }}
                onMouseUp={() => {
                    setDragStartNode(null);
                }}
            >
                <div 
                    className="absolute inset-0 transition-transform duration-200 origin-top-left"
                    style={{ 
                        transform: `scale(${zoom})`,
                        width: '3000px', // Large enough canvas
                        height: '3000px'
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    {/* SVG Connections Layer */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground/30" />
                            </marker>
                        </defs>
                        {links.map(link => {
                            const active = isLinkActive(link.fromId, link.toId);
                            const x1 = link.from.x + NODE_WIDTH;
                            const y1 = link.from.y + NODE_HEIGHT / 2;
                            const x2 = link.to.x;
                            const y2 = link.to.y + NODE_HEIGHT / 2;
                            
                            // Curved path
                            const dx = Math.abs(x2 - x1) * 0.5;
                            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                            return (
                                <path
                                    key={link.key}
                                    d={path}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={active ? 3 : 1}
                                    className={cn(
                                        "transition-all duration-300",
                                        active ? "text-primary opacity-60" : "text-muted-foreground/20 opacity-40"
                                    )}
                                />
                            );
                        })}

                        {/* Live Dragging Line */}
                        {dragStartNode && (
                            <path
                                d={`M ${dragStartNode.x} ${dragStartNode.y} C ${dragStartNode.x + (dragStartNode.port === 'right' ? 100 : -100)} ${dragStartNode.y}, ${mousePos.x + (dragStartNode.port === 'right' ? -50 : 50)} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray="5,5"
                                className="text-primary opacity-50 animate-pulse pointer-events-none"
                            />
                        )}
                    </svg>

                    {/* Nodes Layer */}
                    {Object.entries(positions).map(([key, pos]) => {
                        const item = items.find(i => `${i.type}-${i.id}` === key);
                        const cat = categories.find(c => c.id === item.type);
                        const active = isRelated(key);
                        const isSelected = selectedId === key;

                        return (
                            <div
                                key={key}
                                className={cn(
                                    "absolute transition-all duration-300 cursor-pointer group",
                                    !active && "opacity-20 grayscale",
                                    isSelected && "z-10"
                                )}
                                style={{ 
                                    left: pos.x, 
                                    top: pos.y, 
                                    width: NODE_WIDTH, 
                                    height: NODE_HEIGHT 
                                }}
                                onMouseEnter={() => setHoveredId(key)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(key);
                                }}
                                onDoubleClick={() => navigate(`/details/${item.type}/${item.id}`)}
                            >
                                <Card className={cn(
                                    "h-full w-full border-2 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-xl",
                                    isSelected ? "border-primary ring-4 ring-primary/20 scale-105" : "border-border hover:border-primary/50"
                                )}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className={cn("p-2 rounded-xl shrink-0", cat.bg)}>
                                            <cat.icon className={cn("h-5 w-5", cat.color)} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{cat.name}</p>
                                            <p className="text-sm font-bold truncate leading-tight">{getItemLabel(item)}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.links?.length || 0} connections</p>
                                        </div>
                                    </CardContent>
                                    {isSelected && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded font-bold animate-bounce">
                                            DOUBLE CLICK TO VIEW
                                        </div>
                                    )}
                                </Card>

                                {/* Connection Ports */}
                                {categories.findIndex(c => c.id === item.type) > 0 && (
                                    <div 
                                        className={cn(
                                            "absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary bg-card z-30 transition-all cursor-crosshair opacity-0 group-hover:opacity-100 ring-primary/20 hover:ring-8",
                                            dragStartNode && "opacity-100 scale-110"
                                        )}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setDragStartNode({ 
                                                id: item.id, 
                                                type: item.type, 
                                                port: 'left',
                                                x: pos.x,
                                                y: pos.y + NODE_HEIGHT / 2
                                            });
                                            setMousePos({ x: pos.x, y: pos.y + NODE_HEIGHT / 2 });
                                        }}
                                        onMouseUp={async (e) => {
                                            if (dragStartNode && dragStartNode.id !== item.id) {
                                                e.stopPropagation();
                                                await toggleLink(
                                                    { type: dragStartNode.type, id: dragStartNode.id },
                                                    { type: item.type, id: item.id }
                                                );
                                                await loadData();
                                                setDragStartNode(null);
                                            }
                                        }}
                                    />
                                )}
                                {categories.findIndex(c => c.id === item.type) < categories.length - 1 && (
                                    <div 
                                        className={cn(
                                            "absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary bg-card z-30 transition-all cursor-crosshair opacity-0 group-hover:opacity-100 ring-primary/20 hover:ring-8",
                                            dragStartNode && "opacity-100 scale-110"
                                        )}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setDragStartNode({ 
                                                id: item.id, 
                                                type: item.type, 
                                                port: 'right',
                                                x: pos.x + NODE_WIDTH,
                                                y: pos.y + NODE_HEIGHT / 2
                                            });
                                            setMousePos({ x: pos.x + NODE_WIDTH, y: pos.y + NODE_HEIGHT / 2 });
                                        }}
                                        onMouseUp={async (e) => {
                                            if (dragStartNode && dragStartNode.id !== item.id) {
                                                e.stopPropagation();
                                                await toggleLink(
                                                    { type: dragStartNode.type, id: dragStartNode.id },
                                                    { type: item.type, id: item.id }
                                                );
                                                await loadData();
                                                setDragStartNode(null);
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Column Headers */}
                    {categories.map((cat, idx) => (
                        <div 
                            key={`header-${cat.id}`}
                            className="absolute text-center pointer-events-none"
                            style={{ 
                                left: idx * COLUMN_SPACING + 50, 
                                top: 40,
                                width: NODE_WIDTH 
                            }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                                <cat.icon className={cn("h-4 w-4", cat.color)} />
                                <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <footer className="p-3 border-t bg-muted/30 text-[10px] text-muted-foreground flex justify-between items-center z-20">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-blue-500" /> Passwords</span>
                    <span className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-purple-500" /> OTPs</span>
                    <span className="flex items-center gap-1"><Key className="h-3 w-3 text-orange-500" /> Passkeys</span>
                    <span className="flex items-center gap-1"><Terminal className="h-3 w-3 text-green-500" /> Envs</span>
                </div>
                <div className="font-medium italic">
                    Tip: Hover to highlight connections • Double click to manage links
                </div>
            </footer>
        </div>
    );
};

export default GraphView;
