import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCoursesContext } from '../contexts/CoursesContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Play,
  Save,
  Plus,
  Minus
} from 'lucide-react';
import clsx from 'clsx';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourseById, updateProgress, loading } = useCoursesContext();
  
  const [course, setCourse] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localProgress, setLocalProgress] = useState({
    status: 'not_started',
    completion_percentage: 0,
    time_spent_hours: 0,
    notes: ''
  });

  // Load course data
  useEffect(() => {
    const foundCourse = getCourseById(courseId);
    if (foundCourse) {
      setCourse(foundCourse);
      if (foundCourse.progress) {
        setLocalProgress({
          status: foundCourse.progress.status,
          completion_percentage: foundCourse.progress.completion_percentage,
          time_spent_hours: foundCourse.progress.time_spent_hours,
          notes: foundCourse.progress.notes || ''
        });
      }
    }
  }, [courseId, getCourseById]);

  const handleProgressUpdate = async () => {
    if (!course) return;
    
    try {
      setIsUpdating(true);
      await updateProgress(course.id, localProgress);
      // Update local course data
      const updatedCourse = getCourseById(courseId);
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const updatedProgress = {
      ...localProgress,
      status: newStatus,
      ...(newStatus === 'completed' && { completion_percentage: 100 })
    };
    setLocalProgress(updatedProgress);
    
    try {
      setIsUpdating(true);
      await updateProgress(course.id, updatedProgress);
      const updatedCourse = getCourseById(courseId);
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const adjustTime = (amount) => {
    setLocalProgress(prev => ({
      ...prev,
      time_spent_hours: Math.max(0, prev.time_spent_hours + amount)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Clock className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1',
              getStatusColor(localProgress.status)
            )}>
              {getStatusIcon(localProgress.status)}
              <span className="capitalize">{localProgress.status.replace('_', ' ')}</span>
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {course.category.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        </div>
        <a
          href={course.ossu_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on OSSU</span>
        </a>
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Description</h3>
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Details</h3>
              <div className="space-y-2">
                {course.duration_weeks && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{course.duration_weeks} weeks • {course.effort_hours_per_week}</span>
                  </div>
                )}
                
                {course.url && (
                  <div className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Course Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {course.topics_covered && course.topics_covered.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {course.topics_covered.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Progress */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              
              {/* Status Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { key: 'not_started', label: 'Not Started', icon: Play },
                  { key: 'in_progress', label: 'In Progress', icon: Clock },
                  { key: 'completed', label: 'Completed', icon: CheckCircle }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    disabled={isUpdating}
                    className={clsx(
                      'flex flex-col items-center p-3 rounded-lg border transition-colors',
                      localProgress.status === key
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Progress Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Completion</label>
                  <span className="text-sm font-medium text-gray-900">
                    {localProgress.completion_percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localProgress.completion_percentage}
                  onChange={(e) => setLocalProgress(prev => ({
                    ...prev,
                    completion_percentage: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${localProgress.completion_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Time Spent */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time Spent</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => adjustTime(-0.5)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-lg font-medium text-gray-900">
                      {localProgress.time_spent_hours.toFixed(1)}h
                    </span>
                  </div>
                  <button
                    onClick={() => adjustTime(0.5)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  {[0.5, 1, 2, 4].map(hours => (
                    <button
                      key={hours}
                      onClick={() => adjustTime(hours)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      +{hours}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={localProgress.notes}
                onChange={(e) => setLocalProgress(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add your notes, reflections, or key learnings..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleProgressUpdate}
              disabled={isUpdating}
              className={clsx(
                'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors',
                isUpdating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              )}
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? 'Saving...' : 'Save Progress'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
          <div className="space-y-2">
            {course.prerequisites.map((prereq, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">{prereq}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;