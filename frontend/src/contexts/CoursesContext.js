import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoursesContext = createContext();

export const useCoursesContext = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCoursesContext must be used within a CoursesProvider');
  }
  return context;
};

export const CoursesProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all courses with progress
  const fetchCourses = async (category = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = category ? { category } : {};
      const response = await axios.get(`${API}/courses`, { params });
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch progress summary
  const fetchProgressSummary = async () => {
    try {
      const response = await axios.get(`${API}/progress/summary`);
      setProgressSummary(response.data);
    } catch (err) {
      console.error('Error fetching progress summary:', err);
      setError('Failed to fetch progress summary.');
    }
  };

  // Update course progress
  const updateProgress = async (courseId, progressData) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/courses/${courseId}/progress`, progressData);
      
      // Update the course in local state
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId
            ? { ...course, progress: response.data }
            : course
        )
      );

      // Refresh progress summary
      await fetchProgressSummary();
      
      return response.data;
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress. Please try again.');
      throw err;
    }
  };

  // Sync courses from OSSU
  const syncOssuCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API}/sync-ossu-courses`);
      
      // Refresh courses after sync
      await fetchCourses();
      await fetchProgressSummary();
      
      return true;
    } catch (err) {
      console.error('Error syncing OSSU courses:', err);
      setError('Failed to sync courses from OSSU. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get course by ID
  const getCourseById = (courseId) => {
    return courses.find(course => course.id === courseId);
  };

  // Filter courses by category
  const getCoursesByCategory = (category) => {
    return courses.filter(course => course.category === category);
  };

  // Get courses by status
  const getCoursesByStatus = (status) => {
    return courses.filter(course => {
      if (!course.progress) return status === 'not_started';
      return course.progress.status === status;
    });
  };

  // Initialize data on mount
  useEffect(() => {
    fetchCourses();
    fetchProgressSummary();
  }, []);

  const value = {
    courses,
    progressSummary,
    loading,
    error,
    setError,
    fetchCourses,
    fetchProgressSummary,
    updateProgress,
    syncOssuCourses,
    getCourseById,
    getCoursesByCategory,
    getCoursesByStatus,
  };

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
};