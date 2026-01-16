"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Image as ImageIcon, 
  Search, 
  Upload, 
  Shuffle, 
  Loader2,
  User,
  Link as LinkIcon,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ExtractedAsset, 
  extractAssetsFromCode, 
  replaceAssetInCode, 
  categorizeAsset,
  generatePicsumUrl,
  generateAvatarUrl,
  searchUnsplash,
  UnsplashImage,
  getUnsplashUrlWithSize
} from "@/lib/assets";

interface AssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onCodeUpdate: (newCode: string) => void;
  initialSelectedUrl?: string | null;
  onClearSelection?: () => void;
}

type Tab = "quick" | "browse" | "upload";

// More categories for searching
const SEARCH_CATEGORIES = [
  { label: "All", query: "popular" },
  { label: "Abstract", query: "abstract background" },
  { label: "Gradient", query: "gradient colorful" },
  { label: "Nature", query: "nature landscape" },
  { label: "Business", query: "business office" },
  { label: "Tech", query: "technology digital" },
  { label: "Food", query: "food delicious" },
  { label: "People", query: "people portrait" },
  { label: "City", query: "city architecture" },
  { label: "Minimal", query: "minimal clean" },
  { label: "3D", query: "3d render" },
  { label: "Icons", query: "icon symbol" },
];

export default function AssetsModal({ 
  isOpen, 
  onClose, 
  code, 
  onCodeUpdate,
  initialSelectedUrl,
  onClearSelection
}: AssetsModalProps) {
  const [assets, setAssets] = useState<ExtractedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ExtractedAsset | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("quick");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // Custom URL state
  const [customUrl, setCustomUrl] = useState("");
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  
  // Loading state for preview image
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract assets when code changes
  useEffect(() => {
    if (code) {
      const extracted = extractAssetsFromCode(code);
      setAssets(extracted);
      if (extracted.length > 0 && !selectedAsset) {
        setSelectedAsset(extracted[0]);
      }
    }
  }, [code]);

  // Auto-select asset when modal opens with initialSelectedUrl (from preview click)
  useEffect(() => {
    if (isOpen && initialSelectedUrl && assets.length > 0) {
      console.log('[Assets] Looking for clicked URL:', initialSelectedUrl);
      console.log('[Assets] Available assets:', assets.map(a => a.url));
      
      // Find the asset that matches the clicked URL
      // Try exact match first
      let matchingAsset = assets.find(a => a.url === initialSelectedUrl);
      
      if (!matchingAsset) {
        // Try matching by picsum ID (e.g., /id/123/ should match /id/123/)
        const clickedPicsumId = initialSelectedUrl.match(/picsum\.photos\/id\/(\d+)/)?.[1];
        if (clickedPicsumId) {
          matchingAsset = assets.find(a => {
            const assetPicsumId = a.url.match(/picsum\.photos\/id\/(\d+)/)?.[1];
            return assetPicsumId === clickedPicsumId;
          });
        }
      }
      
      if (!matchingAsset) {
        // Try matching by pravatar img ID
        const clickedPravatarId = initialSelectedUrl.match(/pravatar\.cc\/\d+\?img=(\d+)/)?.[1];
        if (clickedPravatarId) {
          matchingAsset = assets.find(a => {
            const assetPravatarId = a.url.match(/pravatar\.cc\/\d+\?img=(\d+)/)?.[1];
            return assetPravatarId === clickedPravatarId;
          });
        }
      }
      
      if (!matchingAsset) {
        // Try substring match - if clicked URL contains asset URL or vice versa
        matchingAsset = assets.find(a => 
          initialSelectedUrl.includes(a.url) || a.url.includes(initialSelectedUrl)
        );
      }
      
      if (!matchingAsset) {
        // Last resort: find by matching last significant part of URL
        const getUrlKey = (url: string) => {
          // For unsplash, use photo ID
          const unsplashMatch = url.match(/unsplash\.com\/photo-([^/?]+)/);
          if (unsplashMatch) return `unsplash-${unsplashMatch[1]}`;
          
          // For picsum, use full id/dims combo
          const picsumMatch = url.match(/picsum\.photos\/id\/(\d+)\/(\d+)\/(\d+)/);
          if (picsumMatch) return `picsum-${picsumMatch[1]}-${picsumMatch[2]}-${picsumMatch[3]}`;
          
          // For other URLs, use filename
          const filename = url.split('/').pop()?.split('?')[0];
          return filename || url;
        };
        
        const clickedKey = getUrlKey(initialSelectedUrl);
        matchingAsset = assets.find(a => getUrlKey(a.url) === clickedKey);
      }
      
      if (matchingAsset) {
        setIsPreviewLoading(true);
        setSelectedAsset(matchingAsset);
        console.log('[Assets] Auto-selected asset from preview click:', matchingAsset.url);
      } else {
        console.log('[Assets] No matching asset found for:', initialSelectedUrl);
        // If no match found but we have the URL, create a temporary asset entry
        if (initialSelectedUrl.startsWith('http')) {
          const tempAsset: ExtractedAsset = {
            id: 'clicked-' + Date.now(),
            url: initialSelectedUrl,
            type: 'img',
            index: -1,
          };
          setIsPreviewLoading(true);
          setSelectedAsset(tempAsset);
          console.log('[Assets] Created temporary asset for unmatched URL');
        }
      }
      // Clear the selection after handling
      onClearSelection?.();
    }
  }, [isOpen, initialSelectedUrl, assets, onClearSelection]);

  // Load initial images when modal opens or tab changes to browse
  useEffect(() => {
    if (isOpen && activeTab === "browse" && !initialLoaded) {
      handleCategorySearch("All");
      setInitialLoaded(true);
    }
  }, [isOpen, activeTab, initialLoaded]);

  // Update custom URL when asset changes
  useEffect(() => {
    if (selectedAsset) {
      setCustomUrl(selectedAsset.url);
    }
  }, [selectedAsset]);

  // Handle asset replacement
  const handleReplaceAsset = useCallback((asset: ExtractedAsset, newUrl: string) => {
    console.log('[AssetsModal] handleReplaceAsset called');
    console.log('[AssetsModal] Asset URL:', asset.url);
    console.log('[AssetsModal] New URL:', newUrl);
    console.log('[AssetsModal] Code length:', code.length);
    
    const newCode = replaceAssetInCode(code, asset.url, newUrl);
    
    const codeChanged = newCode !== code;
    console.log('[AssetsModal] Code changed:', codeChanged);
    
    if (codeChanged) {
      onCodeUpdate(newCode);
      
      // Update local state immediately
      const updatedAsset = { ...asset, url: newUrl };
      setAssets(prev => prev.map(a => 
        a.id === asset.id ? updatedAsset : a
      ));
      
      // Update selected asset
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(updatedAsset);
        setCustomUrl(newUrl);
      }
      
      // Reset preview loading
      setIsPreviewLoading(true);
    } else {
      console.log('[AssetsModal] WARNING: Code did not change after replacement!');
    }
  }, [code, onCodeUpdate, selectedAsset]);

  // Generate random replacement
  const handleRandomReplace = () => {
    if (!selectedAsset) return;
    const category = categorizeAsset(selectedAsset);
    let newUrl: string;
    if (category === "avatar") {
      newUrl = generateAvatarUrl(selectedAsset.width || 150);
    } else {
      newUrl = generatePicsumUrl(selectedAsset.width || 800, selectedAsset.height || 600);
    }
    handleReplaceAsset(selectedAsset, newUrl);
  };

  // Generate avatar replacement
  const handleAvatarReplace = () => {
    if (!selectedAsset) return;
    const newUrl = generateAvatarUrl(selectedAsset.width || 150);
    handleReplaceAsset(selectedAsset, newUrl);
  };

  // Apply custom URL
  const handleApplyCustomUrl = () => {
    if (!selectedAsset || !customUrl.trim()) return;
    handleReplaceAsset(selectedAsset, customUrl.trim());
  };

  // Search by category
  const handleCategorySearch = async (category: string) => {
    setActiveCategory(category);
    const cat = SEARCH_CATEGORIES.find(c => c.label === category);
    if (!cat) return;
    
    setIsSearching(true);
    try {
      const images = await searchUnsplash(cat.query, 1, 30);
      setUnsplashImages(images);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setActiveCategory("");
    setIsSearching(true);
    try {
      const images = await searchUnsplash(searchQuery, 1, 30);
      setUnsplashImages(images);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle image selection from Unsplash
  const handleSelectImage = (image: UnsplashImage) => {
    if (!selectedAsset) {
      if (assets.length > 0) {
        const asset = assets[0];
        setSelectedAsset(asset);
        const newUrl = getUnsplashUrlWithSize(image.url, asset.width || 800, asset.height);
        handleReplaceAsset(asset, newUrl);
      }
      return;
    }
    
    const newUrl = getUnsplashUrlWithSize(image.url, selectedAsset.width || 800, selectedAsset.height);
    handleReplaceAsset(selectedAsset, newUrl);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }
    
    setIsUploading(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPreview(dataUrl);
    };
    reader.readAsDataURL(file);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", "assets");
      
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          handleReplaceAsset(selectedAsset, data.url);
          setUploadedPreview(null);
        }
      } else {
        // Use data URL as fallback
        const dataReader = new FileReader();
        dataReader.onload = () => {
          handleReplaceAsset(selectedAsset, dataReader.result as string);
          setUploadedPreview(null);
        };
        dataReader.readAsDataURL(file);
      }
    } catch (error) {
      // Use data URL as fallback
      const dataReader = new FileReader();
      dataReader.onload = () => {
        handleReplaceAsset(selectedAsset, dataReader.result as string);
        setUploadedPreview(null);
      };
      dataReader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setInitialLoaded(false);
      setUploadedPreview(null);
      setActiveTab("quick");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-12 right-0 bottom-0 w-[380px] z-40 bg-[#0d0d0d] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF6E3C]/20 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[#FF6E3C]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Assets</h2>
                <p className="text-[10px] text-white/40">{assets.length} images found</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Image List - Horizontal scroll */}
          <div className="border-b border-white/10 p-3 flex-shrink-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Click to select → then replace below</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {assets.map((asset, i) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setIsPreviewLoading(true);
                    setSelectedAsset(asset);
                  }}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all relative group",
                    selectedAsset?.id === asset.id
                      ? "border-[#FF6E3C] ring-2 ring-[#FF6E3C]/30"
                      : "border-transparent hover:border-white/30"
                  )}
                >
                  <img 
                    src={asset.url} 
                    alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23333' viewBox='0 0 24 24'%3E%3Crect width='24' height='24'/%3E%3C/svg%3E";
                    }}
                  />
                  {selectedAsset?.id === asset.id && (
                    <div className="absolute inset-0 bg-[#FF6E3C]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#FF6E3C]" />
                    </div>
                  )}
                </button>
              ))}
              {assets.length === 0 && (
                <p className="text-xs text-white/30 py-4">No images found in code</p>
              )}
            </div>
          </div>

          {/* Tabs - Quick first, Browse second, Upload third */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {[
              { id: "quick" as Tab, label: "Quick", icon: Shuffle },
              { id: "browse" as Tab, label: "Browse", icon: Search },
              { id: "upload" as Tab, label: "Upload", icon: Upload },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2",
                  activeTab === tab.id
                    ? "text-[#FF6E3C] border-[#FF6E3C]"
                    : "text-white/40 border-transparent hover:text-white/60"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {activeTab === "quick" ? (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {selectedAsset ? (
                  <>
                    {/* Preview with loading state */}
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/30 border border-white/10 relative">
                      {isPreviewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
                        </div>
                      )}
                      <img 
                        src={uploadedPreview || selectedAsset.url} 
                        alt="" 
                        className="w-full h-full object-contain"
                        key={selectedAsset.url}
                        onLoadStart={() => setIsPreviewLoading(true)}
                        onLoad={() => setIsPreviewLoading(false)}
                        onError={() => setIsPreviewLoading(false)}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                        {selectedAsset.type === "img" ? "Image" : "BG"}
                      </span>
                      {selectedAsset.width && selectedAsset.height && (
                        <span>{selectedAsset.width}×{selectedAsset.height}</span>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleRandomReplace}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-[#FF6E3C]/10 hover:border-[#FF6E3C]/30 hover:text-white transition-all"
                      >
                        <Shuffle className="w-4 h-4 text-[#FF6E3C]" />
                        Random
                      </button>
                      <button
                        onClick={handleAvatarReplace}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-[#FF6E3C]/10 hover:border-[#FF6E3C]/30 hover:text-white transition-all"
                      >
                        <User className="w-4 h-4 text-[#FF6E3C]" />
                        Avatar
                      </button>
                    </div>
                    
                    {/* Custom URL */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Paste image URL</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCustomUrl()}
                            placeholder="https://..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                          />
                        </div>
                        <button
                          onClick={handleApplyCustomUrl}
                          className="px-3 py-2 rounded-lg bg-[#FF6E3C] text-white text-xs font-medium hover:bg-[#FF6E3C]/90 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <ImageIcon className="w-10 h-10 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">Select an image above first</p>
                  </div>
                )}
              </div>
            ) : activeTab === "browse" ? (
              <>
                {/* Search */}
                <div className="p-3 space-y-2 border-b border-white/5 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search any image..."
                      className="w-full pl-9 pr-16 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#FF6E3C] text-white text-xs font-medium disabled:opacity-50"
                    >
                      {isSearching ? "..." : "Go"}
                    </button>
                  </div>
                  
                  {/* Categories */}
                  <div className="flex flex-wrap gap-1">
                    {SEARCH_CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        onClick={() => handleCategorySearch(cat.label)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] transition-colors",
                          activeCategory === cat.label
                            ? "bg-[#FF6E3C] text-white"
                            : "bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3">
                  {isSearching ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#FF6E3C] animate-spin" />
                    </div>
                  ) : unsplashImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {unsplashImages.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => handleSelectImage(image)}
                          className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-[#FF6E3C] transition-all group relative"
                        >
                          <img 
                            src={image.thumbUrl} 
                            alt={image.description || ""}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-white/20" />
                      <p className="text-xs text-white/30">Click a category or search above</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col p-4 gap-4">
                {/* Current preview */}
                {selectedAsset && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black/30 border border-white/10 flex-shrink-0 relative">
                    {isPreviewLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
                      </div>
                    )}
                    <img 
                      src={uploadedPreview || selectedAsset.url} 
                      alt="" 
                      className="w-full h-full object-contain"
                      key={uploadedPreview || selectedAsset.url}
                      onLoadStart={() => setIsPreviewLoading(true)}
                      onLoad={() => setIsPreviewLoading(false)}
                      onError={() => setIsPreviewLoading(false)}
                    />
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !selectedAsset}
                  className={cn(
                    "flex-1 min-h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
                    isUploading 
                      ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/5" 
                      : "border-white/20 hover:border-[#FF6E3C]/50 hover:bg-white/5",
                    !selectedAsset && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
                      <span className="text-sm text-[#FF6E3C]">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white/30" />
                      <span className="text-sm text-white/50">Click to upload image</span>
                      <span className="text-xs text-white/30">PNG, JPG, GIF up to 10MB</span>
                    </>
                  )}
                </button>
                
                {!selectedAsset && (
                  <p className="text-xs text-center text-white/40">
                    Select an image above first
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
