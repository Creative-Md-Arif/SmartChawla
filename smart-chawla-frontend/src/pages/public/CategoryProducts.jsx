import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../../components/cards/ProductCard';
import CategoryBreadcrumb from '../../components/category/CategoryBreadcrumb';
import axiosInstance from '../../utils/axiosInstance';
import { ProductCardSkeleton } from '../../components/common/Loader';

const CategoryProducts = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, [slug]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const [categoryRes, productsRes] = await Promise.all([
        axiosInstance.get(`/categories/${slug}`),
        axiosInstance.get(`/categories/${slug}/products`),
      ]);
      setCategory(categoryRes.data.category);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = category
    ? [
        { name: 'Categories', url: '/categories' },
        { name: category.name.bn || category.name.en, url: `/category/${slug}` },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CategoryBreadcrumb items={breadcrumbItems} />

      {category && (
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {category.name.bn || category.name.en}
          </h1>
          {category.description?.en && (
            <p className="mt-2 text-gray-600">{category.description.en}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No products found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;
