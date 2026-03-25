import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCategories,
  fetchCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../redux/slices/categorySlice";

export const useCategories = (options = {}) => {
  const dispatch = useDispatch();
  const { categories, treeStructure, loading, error, selectedCategory } = useSelector(
    (state) => state.category
  );

  useEffect(() => {
    if (options.tree) {
      if (treeStructure.length === 0) {
        dispatch(fetchCategoryTree());
      }
    } else {
      if (categories.length === 0) {
        dispatch(fetchCategories(options.params));
      }
    }
  }, [dispatch, options.tree, options.params]);

  const refresh = () => {
    if (options.tree) {
      dispatch(fetchCategoryTree());
    } else {
      dispatch(fetchCategories(options.params));
    }
  };

  const getCategoryById = (id) => {
    return categories.find((cat) => cat._id === id);
  };

  const getSubcategories = (parentId) => {
    return categories.filter((cat) => cat.parentCategory === parentId);
  };

  return {
    categories: options.tree ? treeStructure : categories,
    loading,
    error,
    selectedCategory,
    refresh,
    getCategoryById,
    getSubcategories,
  };
};

export { createCategory, updateCategory, deleteCategory }; 
export default useCategories;
