import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  BarChart3, CheckCircle2, Clock, Zap, Target, BookOpen, CalendarDays, Award
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  getAllActivities, getCompletionHistory
} from '../utils/storage';
import {
  formatDuration, timeToMinutes, formatDateStr
} from '../utils/timeUtils';
import '../styles/Progress.css';

export default function Progress() {
  const { getAllActivitiesForDate, completionHistory, settings } = useApp();

  // Compute analytics across the past 7 days and all stored history
  const analytics = useMemo(() => {
    const daysData = [];
    let totalThesisMinutes = 0;
    let totalPvsystMinutes = 0;
    let totalSolarDesignMinutes = 0;
    let totalFocusMinutes = 0;
    let totalCompletedTasks = 0;
    let totalPlannedTasks = 0;
    let totalFocusBlocksPlanned = 0;
    let totalFocusBlocksCompleted = 0;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateStr(d);
      const dayName = daysOfWeek[d.getDay()];

      const activities = getAllActivitiesForDate(dateStr);
      const dayHistory = completionHistory[dateStr] || {};

      let dayCompleted = 0;
      let dayFocusMinutes = 0;
      let dayThesisMinutes = 0;
      let dayPvsystMinutes = 0;
      let daySolarMinutes = 0;

      activities.forEach(act => {
        const dur = (timeToMinutes(act.endTime) - timeToMinutes(act.startTime)) || 0;
        const isDone = act.completed || dayHistory[act.id]?.completed;

        if (act.type === 'Focus Block') {
          totalFocusBlocksPlanned++;
          if (isDone) {
            totalFocusBlocksCompleted++;
            dayFocusMinutes += dur;
          }
        }

        if (isDone) {
          dayCompleted++;
          totalCompletedTasks++;

          if (act.category === 'Thesis' || act.focusBlock === 'fb3') {
            dayThesisMinutes += dur;
            totalThesisMinutes += dur;
          } else if (act.category === 'PVsyst') {
            dayPvsystMinutes += dur;
            totalPvsystMinutes += dur;
          } else if (act.category === 'Solar System Design') {
            daySolarMinutes += dur;
            totalSolarDesignMinutes += dur;
          }
        }
      });

      totalPlannedTasks += activities.length;
      totalFocusMinutes += dayFocusMinutes;

      daysData.push({
        date: dateStr,
        day: dayName,
        planned: activities.length,
        completed: dayCompleted,
        focusHours: +(dayFocusMinutes / 60).toFixed(1),
        thesisHours: +(dayThesisMinutes / 60).toFixed(1),
        pvsystHours: +((dayPvsystMinutes + daySolarMinutes) / 60).toFixed(1),
      });
    }

    const categoryDistribution = [
      { name: 'Thesis Work', value: +(totalThesisMinutes / 60).toFixed(1), color: '#8B5CF6' },
      { name: 'PVsyst Simulation', value: +(totalPvsystMinutes / 60).toFixed(1), color: '#EC4899' },
      { name: 'Solar Design', value: +(totalSolarDesignMinutes / 60).toFixed(1), color: '#F59E0B' },
      { name: 'Other Focus Time', value: +Math.max(0, (totalFocusMinutes - totalThesisMinutes - totalPvsystMinutes - totalSolarDesignMinutes) / 60).toFixed(1), color: '#10B981' },
    ].filter(item => item.value > 0);

    const completionRate = totalPlannedTasks > 0
      ? Math.round((totalCompletedTasks / totalPlannedTasks) * 100)
      : 0;

    const focusBlockRate = totalFocusBlocksPlanned > 0
      ? Math.round((totalFocusBlocksCompleted / totalFocusBlocksPlanned) * 100)
      : 0;

    const hasData = totalPlannedTasks > 0 || totalCompletedTasks > 0 || totalFocusMinutes > 0;

    return {
      daysData,
      totalThesisHours: +(totalThesisMinutes / 60).toFixed(1),
      totalPvsystHours: +(totalPvsystMinutes / 60).toFixed(1),
      totalSolarDesignHours: +(totalSolarDesignMinutes / 60).toFixed(1),
      totalFocusHours: +(totalFocusMinutes / 60).toFixed(1),
      totalCompletedTasks,
      totalPlannedTasks,
      completionRate,
      focusBlockRate,
      categoryDistribution,
      hasData
    };
  }, [getAllActivitiesForDate, completionHistory]);

  return (
    <div className="progress-page">
      <div className="progress-page__header">
        <div>
          <h2>Productivity Analytics</h2>
          <p className="progress-page__subtitle">Track your deep work hours, thesis momentum, and weekly completion</p>
        </div>
      </div>

      <div className="progress-page__stats">
        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon"><BookOpen size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{analytics.totalThesisHours}h</span>
            <span className="stat-card__label">Thesis Research Time</span>
          </div>
        </div>

        <div className="stat-card stat-card--teal">
          <div className="stat-card__icon"><Zap size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{analytics.totalPvsystHours}h</span>
            <span className="stat-card__label">PVsyst & Simulation</span>
          </div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-card__icon"><Award size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{analytics.totalSolarDesignHours}h</span>
            <span className="stat-card__label">Solar Design</span>
          </div>
        </div>

        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon"><Clock size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{analytics.totalFocusHours}h</span>
            <span className="stat-card__label">Total Focus Time</span>
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-card__icon"><CheckCircle2 size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{analytics.completionRate}%</span>
            <span className="stat-card__label">Task Completion Rate</span>
          </div>
        </div>
      </div>

      {!analytics.hasData ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <BarChart3 size={56} />
          <h3>No Historical Data Yet</h3>
          <p>
            As you plan your daily schedule and mark activities and focus blocks as completed, your productivity trends will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="progress-charts-grid">
          <div className="chart-card">
            <div className="chart-card__header">
              <h3>Weekly Planned vs Completed Tasks</h3>
              <span className="chart-card__badge">{analytics.totalCompletedTasks}/{analytics.totalPlannedTasks} tasks</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="planned" name="Planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <h3>Daily Focus Hours (Past 7 Days)</h3>
              <span className="chart-card__badge">{analytics.totalFocusHours} hours total</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="thesisHours" name="Thesis Hours" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pvsystHours" name="PVsyst & Solar" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analytics.categoryDistribution.length > 0 && (
            <div className="chart-card chart-card--wide">
              <div className="chart-card__header">
                <h3>Priority Focus Time Breakdown</h3>
                <span className="chart-card__badge">Hours distribution</span>
              </div>
              <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}h`}
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

