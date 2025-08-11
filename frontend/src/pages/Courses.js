import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCoursesContext } from '../contexts/CoursesContext';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import clsx from 'clsx';

const Courses = () => {
  const {
    courses,
    loading,
    error,
    fetchCourses
  } = useCoursesContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('filter') || 'all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'intro_cs', label: 'Intro CS' },
    { value: 'core_programming', label: 'Core Programming' },
    { value: 'core_math', label: 'Core Math' },
    { value: 'cs_tools', label: 'CS Tools' },
    { value: 'core_systems', label: 'Core Systems' },
    { value: 'core_theory', label: 'Core Theory' },
    { value: 'core_security', label: 'Core Security' },
    { value: 'core_applications', label: 'Core Applications' },
    { value: 'core_ethics', label: 'Core Ethics' },
    { value: 'advanced_programming', label: 'Advanced Programming' },
    { value: 'advanced_systems', label: 'Advanced Systems' },
    { value: 'advanced_theory', label: 'Advanced Theory' },
    { value: 'advanced_security', label: 'Advanced Security' },
    { value: 'advanced_math', label: 'Advanced Math' },
    { value: 'final_project', label: 'Final Project' }
  ];

  const statusFilters = [
    { value: 'all', label: 'All Courses' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  // Filter courses based on search term, category, and status
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'not_started') {
        matchesStatus = !course.progress || course.progress.status === 'not_started';
      } else {
        matchesStatus = course.progress && course.progress.status === selectedStatus;
      }
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedStatus !== 'all') params.set('filter', selectedStatus);
    setSearchParams(params);
  }, [selectedCategory, selectedStatus, setSearchParams]);

  const getStatusIcon = (course) => {
    if (!course.progress || course.progress.status === 'not_started') {
      return <Play className="w-4 h-4 text-gray-400" />;
    } else if (course.progress.status === 'in_progress') {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    } else if (course.progress.status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Play className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (course) => {
    if (!course.progress || course.progress.status === 'not_started') {
      return 'border-gray-200 hover:border-gray-300';
    } else if (course.progress.status === 'in_progress') {
      return 'border-yellow-200 bg-yellow-50';
    } else if (course.progress.status === 'completed') {
      return 'border-green-200 bg-green-50';
    }
    return 'border-gray-200';
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OSSU Computer Science Courses</h1>
        <p className="text-gray-600 mt-1">
          Complete curriculum for a free self-taught education in Computer Science
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <CheckCircle className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {statusFilters.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {courses.length === 0 
              ? 'Click "Sync OSSU Courses" in the dashboard to load courses from the OSSU curriculum.'
              : 'Try adjusting your search or filters.'
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={clsx(
                'bg-white rounded-lg border-2 p-6 transition-all hover:shadow-md',
                getStatusColor(course)
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(course)}
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {course.category.replace('_', ' ')}
                  </span>
                </div>
                <a
                  href={course.ossu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="View on OSSU"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="space-y-2 mb-4">
                {course.duration_weeks && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{course.duration_weeks} weeks • {course.effort_hours_per_week}</span>
                  </div>
                )}

                {course.topics_covered && course.topics_covered.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.topics_covered.slice(0, 3).map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {course.topics_covered.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{course.topics_covered.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {course.progress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{course.progress.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to={`/courses/${course.id}`}
                className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Course
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;