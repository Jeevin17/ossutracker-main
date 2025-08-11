import React from 'react';
import { CheckCircle, Clock, BookOpen, TrendingUp } from 'lucide-react';

const ProgressCard = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      title: 'Total Courses',
      value: summary.total_courses,
      icon: BookOpen,
      color: 'blue',
    },
    {
      title: 'Completed',
      value: summary.completed_courses,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'In Progress',
      value: summary.in_progress_courses,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Time Spent',
      value: `${Math.round(summary.total_time_spent_hours)}h`,
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-6 rounded-lg border ${getColorClasses(card.color)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <Icon className="w-8 h-8 opacity-60" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressCard;