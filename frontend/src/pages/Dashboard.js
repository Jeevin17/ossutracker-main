import React from 'react';
import { useCoursesContext } from '../contexts/CoursesContext';
import ProgressCard from '../components/ProgressCard';
import { Link } from 'react-router-dom';
import { RefreshCw, ExternalLink, BookOpen, Clock, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const Dashboard = () => {
  const {
    courses,
    progressSummary,
    loading,
    error,
    syncOssuCourses,
    getCoursesByStatus
  } = useCoursesContext();

  const handleSync = async () => {
    try {
      await syncOssuCourses();
    } catch (err) {
      // Error is handled in context
    }
  };

  const inProgressCourses = getCoursesByStatus('in_progress').slice(0, 3);
  const recentCompletedCourses = getCoursesByStatus('completed').slice(0, 3);

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your OSSU Computer Science progress</p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className={clsx(
            'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          <span>Sync OSSU Courses</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Progress Cards */}
      <ProgressCard summary={progressSummary} />

      {/* Progress Bar */}
      {progressSummary && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
            <span className="text-sm font-medium text-gray-600">
              {progressSummary.completion_percentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressSummary.completion_percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {progressSummary.completed_courses} of {progressSummary.total_courses} courses completed
          </p>
        </div>
      )}

      {/* Current Courses */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* In Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              In Progress
            </h3>
            <Link
              to="/courses?filter=in_progress"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {inProgressCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No courses in progress</p>
              <Link
                to="/courses"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1 inline-block"
              >
                Start a course
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{course.title}</h4>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{course.description}</p>
                      {course.progress && (
                        <div className="flex items-center mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${course.progress.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {course.progress.completion_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Recently Completed
            </h3>
            <Link
              to="/courses?filter=completed"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {recentCompletedCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No completed courses yet</p>
              <p className="text-sm mt-1">Complete your first course to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompletedCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{course.title}</h4>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{course.description}</p>
                      {course.progress && course.progress.completed_at && (
                        <p className="text-green-600 text-xs mt-1">
                          Completed {new Date(course.progress.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/courses"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">Browse Courses</h4>
              <p className="text-sm text-gray-600">Explore OSSU curriculum</p>
            </div>
          </Link>
          
          <Link
            to="/courses?category=intro_cs"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 font-semibold text-sm">CS</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Start with Intro CS</h4>
              <p className="text-sm text-gray-600">Begin your CS journey</p>
            </div>
          </Link>
          
          <div
            onClick={handleSync}
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={clsx('w-8 h-8 text-purple-600 mr-3', loading && 'animate-spin')} />
            <div>
              <h4 className="font-medium text-gray-900">Sync Courses</h4>
              <p className="text-sm text-gray-600">Update from OSSU repo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;