'use client';

import { useState, useEffect } from 'react';

interface CacheStatus {
  timestamp: string;
  dataSource: 'cache' | 'firestore' | 'unknown';
  requestId: string;
  executionTime: number;
  itemCount: number;
  fetchTime?: number;
  cacheStatus?: 'HIT' | 'MISS' | 'STALE';
}

interface RevalidationResult {
  revalidated: boolean;
  timestamp: string;
  executionTime: number;
  operations: Array<{
    type: 'path' | 'tag';
    target: string;
    success: boolean;
    executionTime?: number;
    error?: string;
  }>;
  tags?: string[];
  paths?: string[];
}

export default function CacheDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [lastRevalidation, setLastRevalidation] = useState<RevalidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only show in development mode or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    typeof window !== 'undefined' && 
                    (window.location.search.includes('debug=true') || 
                     localStorage.getItem('cache-debug') === 'true');

  useEffect(() => {
    if (!shouldShow) return;
    
    // Try to get cache debug info from localStorage
    const savedStatus = localStorage.getItem('last-cache-status');
    if (savedStatus) {
      try {
        setCacheStatus(JSON.parse(savedStatus));
      } catch (e) {
        console.error('Failed to parse cached status:', e);
      }
    }

    const savedRevalidation = localStorage.getItem('last-revalidation');
    if (savedRevalidation) {
      try {
        setLastRevalidation(JSON.parse(savedRevalidation));
      } catch (e) {
        console.error('Failed to parse revalidation result:', e);
      }
    }
  }, [shouldShow]);

  const testCacheStatus = async () => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/projects', {
        headers: {
          'Cache-Control': 'no-cache',
          'x-debug-request': 'true'
        }
      });
      
      const executionTime = Date.now() - startTime;
      const data = await response.json();
      
      // Extract debug information from headers
      const debugInfo: CacheStatus = {
        timestamp: new Date().toISOString(),
        dataSource: response.headers.get('x-data-source') === 'firestore-admin' ? 'firestore' : 'unknown',
        requestId: response.headers.get('x-request-id') || 'unknown',
        executionTime,
        itemCount: parseInt(response.headers.get('x-item-count') || '0'),
        fetchTime: parseInt(response.headers.get('x-fetch-time') || '0'),
        cacheStatus: (response.headers.get('x-cache-status') as any) || 'MISS'
      };

      setCacheStatus(debugInfo);
      localStorage.setItem('last-cache-status', JSON.stringify(debugInfo));
    } catch (error) {
      console.error('Cache test failed:', error);
      setCacheStatus({
        timestamp: new Date().toISOString(),
        dataSource: 'unknown',
        requestId: 'error',
        executionTime: 0,
        itemCount: 0,
        cacheStatus: 'MISS'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const manualRevalidation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: ['projects'],
          paths: ['/portfolio', '/works'],
          debug: true,
          secret: process.env.REVALIDATION_SECRET_TOKEN
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastRevalidation(result);
        localStorage.setItem('last-revalidation', JSON.stringify(result));
        
        // Refresh cache status after revalidation
        setTimeout(() => {
          testCacheStatus();
        }, 1000);
      } else {
        console.error('Manual revalidation failed:', await response.text());
      }
    } catch (error) {
      console.error('Manual revalidation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugMode = () => {
    const newState = !localStorage.getItem('cache-debug') || localStorage.getItem('cache-debug') === 'false';
    localStorage.setItem('cache-debug', newState.toString());
    window.location.reload();
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        title="Cache Debug Panel"
      >
        🔧 Cache Debug
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-2xl w-96 max-h-96 overflow-y-auto">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Cache Debug Panel</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Cache Status */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Current Cache Status</h4>
              {cacheStatus ? (
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Data Source:</span>
                    <span className={`font-medium ${
                      cacheStatus.dataSource === 'firestore' ? 'text-red-600' : 
                      cacheStatus.dataSource === 'cache' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {cacheStatus.dataSource.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Status:</span>
                    <span className={`font-medium ${
                      cacheStatus.cacheStatus === 'HIT' ? 'text-green-600' : 
                      cacheStatus.cacheStatus === 'MISS' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {cacheStatus.cacheStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Execution Time:</span>
                    <span>{cacheStatus.executionTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items Count:</span>
                    <span>{cacheStatus.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(cacheStatus.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Request ID:</span>
                    <span className="font-mono">{cacheStatus.requestId}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No cache data available</p>
              )}
            </div>

            {/* Last Revalidation */}
            {lastRevalidation && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Last Revalidation</h4>
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      lastRevalidation.revalidated ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lastRevalidation.revalidated ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Execution Time:</span>
                    <span>{lastRevalidation.executionTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operations:</span>
                    <span>{lastRevalidation.operations.length}</span>
                  </div>
                  {lastRevalidation.tags && (
                    <div>
                      <span>Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lastRevalidation.tags.map(tag => (
                          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={testCacheStatus}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '⏳ Testing...' : '🔄 Test Cache Status'}
              </button>
              
              <button
                onClick={manualRevalidation}
                disabled={isLoading}
                className="w-full bg-orange-600 text-white py-2 px-3 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? '⏳ Revalidating...' : '🔥 Manual Revalidation'}
              </button>

              <button
                onClick={toggleDebugMode}
                className="w-full bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700"
              >
                🎛️ Toggle Debug Mode
              </button>
            </div>

            {/* Legend */}
            <div className="text-xs text-gray-500 space-y-1">
              <div><span className="text-green-600">●</span> Cache Hit - Data served from cache</div>
              <div><span className="text-red-600">●</span> Cache Miss - Data fetched from Firestore</div>
              <div><span className="text-yellow-600">●</span> Stale - Data may be outdated</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}