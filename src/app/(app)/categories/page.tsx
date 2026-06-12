import { getCategories } from "@/lib/actions/categories"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryActions } from "./category-actions" 

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {categories.length} categories
          </p>
        </div>
        <CategoryActions />
      </div>

      <div className="grid gap-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="glass-card">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat._count?.transactions || 0} transaction{(cat._count?.transactions !== 1) ? "s" : ""}
                    {(cat._count?.budgets ?? 0) > 0 && ` · ${cat._count.budgets} budget${cat._count.budgets !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cat.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
                {!cat.isDefault && (
                  <CategoryActions categoryId={cat.id} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
