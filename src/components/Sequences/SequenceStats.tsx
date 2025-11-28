import { useState, useEffect } from "react";
import { getAllSequences, type Sequence } from "@/lib/storage/sequenceStorage";
import { List, Film, Clock, TrendingUp } from "lucide-react";

export function SequenceStats() {
  const [stats, setStats] = useState({
    totalSequences: 0,
    totalScenes: 0,
    averageScenes: 0,
    totalDuration: 0,
    sequencesWithManual: 0,
  });

  const calculateStats = () => {
    const sequences = getAllSequences();
    
    let totalScenes = 0;
    let totalDuration = 0;
    let sequencesWithManual = 0;
    
    sequences.forEach((sequence) => {
      const scenes = (sequence as any).scenes || (sequence as any).items || [];
      totalScenes += scenes.length;
      
      let sequenceDuration = 0;
      let hasManual = false;
      
      scenes.forEach((scene: any) => {
        if (scene.durationMode === "manual" || scene.duration === 0) {
          hasManual = true;
        } else {
          sequenceDuration += scene.durationSeconds || scene.duration || 0;
        }
      });
      
      if (hasManual) {
        sequencesWithManual++;
      }
      
      totalDuration += sequenceDuration;
    });
    
    setStats({
      totalSequences: sequences.length,
      totalScenes,
      averageScenes: sequences.length > 0 ? Math.round((totalScenes / sequences.length) * 10) / 10 : 0,
      totalDuration: Math.round(totalDuration),
      sequencesWithManual,
    });
  };

  useEffect(() => {
    calculateStats();
    
    // Refresh stats when window gains focus (in case sequences were updated in another tab)
    const handleFocus = () => {
      calculateStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Also refresh periodically to catch changes
    const interval = setInterval(calculateStats, 2000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const statsData = [
    {
      name: "Total sequences",
      value: stats.totalSequences.toString(),
      icon: List,
      change: null,
    },
    {
      name: "Total scenes",
      value: stats.totalScenes.toString(),
      icon: Film,
      change: null,
    },
    {
      name: "Avg scenes/sequence",
      value: stats.averageScenes.toString(),
      icon: TrendingUp,
      change: null,
    },
    {
      name: "Total duration",
      value: stats.sequencesWithManual > 0 ? "Variable" : formatDuration(stats.totalDuration),
      icon: Clock,
      change: stats.sequencesWithManual > 0 ? `${stats.sequencesWithManual} manual` : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 sm:px-6"
          >
            <dt>
              <div className="absolute rounded-md bg-slate-50 dark:bg-slate-700/50 p-3">
                <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              {stat.change && (
                <p className="ml-2 flex items-baseline text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {stat.change}
                </p>
              )}
            </dd>
          </div>
        );
      })}
    </div>
  );
}

