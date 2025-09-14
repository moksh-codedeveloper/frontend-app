/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  File,
  Calendar,
  HardDrive
} from "lucide-react";

interface FileItem {
  public_id: string;
  url: string;
  format: string;
  size: number;
  created_at: string;
  resource_type: string;
  display_name: string;
  width?: number;
  height?: number;
}

interface FetchResponse {
  files: FileItem[];
  total_count: number;
  next_cursor: string | null;
  has_more: boolean;
}

export default function FileViewer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "image" | "pdf">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [retryCount, setRetryCount] = useState(1);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get file icon
  const getFileIcon = (file: FileItem) => {
    if (file.resource_type === 'image') {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (file.format === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Get file type badge color
  const getBadgeColor = (file: FileItem) => {
    if (file.resource_type === 'image') return 'bg-blue-100 text-blue-800';
    if (file.format === 'pdf') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const fetchFiles = useCallback(async (nextCursor: string | null = null, reset: boolean = false) => {
  setLoading(true);
  setError(null);

  const payload = {
    limit: 12,
    type: type === "all" ? undefined : type,
    cursor: nextCursor || undefined,
    page: 1,
  };

  try {
    const res = await axios.post('/api/cloudinary_fetch', payload, {
      withCredentials: true,
      timeout: 30000,
    });

    const data: FetchResponse = res.data;

    if (reset) {
      setFiles(data.files || []);
    } else {
      setFiles((prev) => [...prev, ...(data.files || [])]);
    }
    
    setCursor(data.next_cursor || null);
    setTotalCount(data.total_count || 0);
    setHasMore(data.has_more || false);
    setRetryCount(0);

  } catch (err: any) {
    console.error("Error fetching files:", err);
    let errorMessage = "Failed to load files. Please try again.";
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please refresh the page and try again.";
      } else if (err.response?.status === 400) {
        errorMessage = `Bad request: ${err.response.data?.message || 'Invalid parameters'}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
    }
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, [type]);


  // Retry mechanism
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchFiles(null, true);
    }
  }, [fetchFiles, retryCount]);

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.public_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download file
  const downloadFile = useCallback(async (file: FileItem) => {
    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.display_name || `file.${file.format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  // View file in new tab
  const viewFile = useCallback((file: FileItem) => {
    window.open(file.url, '_blank');
  }, []);

  useEffect(() => {
    setFiles([]);
    setCursor(null);
    setRetryCount(0);
    fetchFiles(null, true);
  }, [type]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Your Files
              </CardTitle>
              <CardDescription className="text-gray-300">
                {totalCount > 0 ? `${totalCount} files found` : 'Manage your uploaded files'}
              </CardDescription>
            </div>
            
            <Button 
              onClick={() => fetchFiles(null, true)}
              disabled={loading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="border border-gray-600 p-2 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Files</option>
                <option value="image">Images Only</option>
                <option value="pdf">PDFs Only</option>
              </select>
            </div>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm">{error}</p>
                  {retryCount < 3 && (
                    <Button 
                      onClick={handleRetry}
                      size="sm"
                      variant="outline"
                      className="mt-2 border-red-500/30 text-red-300 hover:bg-red-900/30"
                    >
                      Retry ({3 - retryCount} attempts left)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading your files...</p>
            </div>
          )}

          {/* Files Grid */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.public_id}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent className="p-4">
                    {/* File Preview */}
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center relative">
                      {file.resource_type === 'image' ? (
                        <img 
                          src={file.url} 
                          alt={file.display_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileText className="w-12 h-12 mb-2" />
                          <span className="text-xs font-medium">{file.format.toUpperCase()}</span>
                        </div>
                      )}
                      
                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewFile(file);
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <h3 className="text-sm font-medium text-white truncate flex-1">
                          {file.display_name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(file.size)}
                        </span>
                        <Badge className={`text-xs ${getBadgeColor(file)}`}>
                          {file.format.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No files found</p>
                <p className="text-sm">
                  {searchTerm 
                    ? `No files match "${searchTerm}"`
                    : type !== "all" 
                      ? `No ${type} files found`
                      : "Upload some files to get started"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && filteredFiles.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => fetchFiles(cursor)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More Files'
                )}
              </Button>
            </div>
          )}

          {/* Loading More Indicator */}
          {loading && files.length > 0 && (
            <div className="flex justify-center mt-4">
              <Progress value={50} className="w-32 h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Details Modal */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div 
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">{selectedFile.display_name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  {selectedFile.resource_type === 'image' ? (
                    <img 
                      src={selectedFile.url} 
                      alt={selectedFile.display_name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FileText className="w-16 h-16 mx-auto mb-2" />
                      <p>{selectedFile.format.toUpperCase()} File</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">File Details</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><span className="font-medium">Format:</span> {selectedFile.format.toUpperCase()}</p>
                    <p><span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}</p>
                    <p><span className="font-medium">Type:</span> {selectedFile.resource_type}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(selectedFile.created_at)}</p>
                    {selectedFile.width && selectedFile.height && (
                      <p><span className="font-medium">Dimensions:</span> {selectedFile.width} × {selectedFile.height}px</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => viewFile(selectedFile)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    onClick={() => downloadFile(selectedFile)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}