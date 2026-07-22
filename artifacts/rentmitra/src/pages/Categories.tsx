import { Link } from "wouter";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { useGetCategories, getGetCategoriesQueryKey } from "@workspace/api-client-react";

export default function Categories() {
  const { data, isLoading } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() }
  });

  // Merge static categories with listing counts from API if available
  const categoriesWithCounts = CATEGORIES.map(c => {
    const apiCat = data?.find(ac => ac.slug === c.slug);
    return { ...c, count: apiCat?.listingCount || 0 };
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
      <h1 className="text-3xl font-bold mb-8">All Categories</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {categoriesWithCounts.map(cat => {
          const Icon = Icons[cat.icon as keyof typeof Icons] as React.ElementType;
          return (
            <Link 
              key={cat.id} 
              href={`/search?category=${cat.slug}`}
              className="bg-background border border-border hover:border-primary rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-all hover:shadow-lg hover:shadow-primary/10 group"
            >
              <div className="w-16 h-16 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                {Icon && <Icon className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{cat.count} listings</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
