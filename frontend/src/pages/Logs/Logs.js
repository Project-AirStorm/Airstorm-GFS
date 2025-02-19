import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import LogViewer from '../../../components/specific/LogViewer/LogViewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLogger, setSelectedLogger] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/logs`);
      setLogs(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch logs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.toLowerCase().includes(selectedLevel);
    const matchesLogger = selectedLogger === 'all' || log.includes(selectedLogger);
    
    return matchesSearch && matchesLevel && matchesLogger;
  });

  if (loading) return <div className="logs-loading">Loading logs...</div>;
  if (error) return <div className="logs-error">{error}</div>;

  // Get unique loggers for filter
  const loggers = [...new Set(logs.map(log => {
    const parts = log.split('|');
    return parts[1]?.trim() || '';
  }))].filter(Boolean);

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">System Logs</CardTitle>
              <p className="text-sm text-gray-500 mt-1">View and analyze system activity</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                className="icon-button"
              >
                <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="primary-button">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="search-bar flex-1">
                <Search className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="search-input"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <select
                  value={selectedLogger}
                  onChange={(e) => setSelectedLogger(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Loggers</option>
                  {loggers.map(logger => (
                    <option key={logger} value={logger}>{logger}</option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Logs</TabsTrigger>
                <TabsTrigger value="error">Errors</TabsTrigger>
                <TabsTrigger value="warning">Warnings</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[600px] mt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading-spinner" />
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="retry-button">
                      Retry
                    </button>
                  </div>
                ) : (
                  <LogViewer logs={filteredLogs} />
                )}
              </ScrollArea>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;