import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant, useMenuCategories, useMenuItems, MenuCategory, MenuItem } from '@/hooks/useRestaurant';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, FolderOpen, UtensilsCrossed, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DashboardMenu = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { categories, addCategory, updateCategory, deleteCategory } = useMenuCategories(restaurant?.id);
  const { items, addItem, updateItem, deleteItem } = useMenuItems(restaurant?.id);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !restaurantLoading && user && !restaurant) {
      navigate('/onboarding');
    }
  }, [user, restaurant, authLoading, restaurantLoading, navigate]);

  if (authLoading || restaurantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) return null;

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category_id === selectedCategory);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Menu</h1>
            <p className="text-muted-foreground">Manage your menu categories and items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            <Button onClick={() => setShowItemDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </Button>
          {categories.map((category) => (
            <div key={category.id} className="relative group">
              <Button
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
              <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                <button
                  className="p-1 bg-card border border-border rounded-full shadow-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(category);
                    setShowCategoryDialog(true);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding categories and menu items.
              </p>
              <Button onClick={() => setShowItemDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.image_url && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.is_popular && (
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      <p className="text-lg font-bold mt-2">
                        {restaurant.currency} {Number(item.price).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {categories.find(c => c.id === item.category_id)?.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item);
                          setShowItemDialog(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (confirm('Delete this item?')) {
                            await deleteItem(item.id);
                            toast({ title: 'Item deleted' });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={async (checked) => {
                        await updateItem(item.id, { is_available: checked });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Category Dialog */}
        <CategoryDialog
          open={showCategoryDialog}
          category={editingCategory}
          onClose={() => {
            setShowCategoryDialog(false);
            setEditingCategory(null);
          }}
          onSave={async (name, description) => {
            if (editingCategory) {
              await updateCategory(editingCategory.id, { name, description });
              toast({ title: 'Category updated' });
            } else {
              await addCategory(name, description);
              toast({ title: 'Category added' });
            }
          }}
          onDelete={async () => {
            if (editingCategory) {
              await deleteCategory(editingCategory.id);
              toast({ title: 'Category deleted' });
            }
          }}
        />

        {/* Item Dialog */}
        <ItemDialog
          open={showItemDialog}
          item={editingItem}
          categories={categories}
          currency={restaurant.currency}
          onClose={() => {
            setShowItemDialog(false);
            setEditingItem(null);
          }}
          onSave={async (data) => {
            if (editingItem) {
              await updateItem(editingItem.id, data);
              toast({ title: 'Item updated' });
            } else {
              await addItem(data);
              toast({ title: 'Item added' });
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
};

interface CategoryDialogProps {
  open: boolean;
  category: MenuCategory | null;
  onClose: () => void;
  onSave: (name: string, description?: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

const CategoryDialog = ({ open, category, onClose, onSave, onDelete }: CategoryDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim() || undefined);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Appetizers, Main Course"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {category && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm('Delete this category and all its items?')) {
                  await onDelete();
                  onClose();
                }
              }}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface MenuItemData {
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
}

interface ItemDialogProps {
  open: boolean;
  item: MenuItem | null;
  categories: MenuCategory[];
  currency: string;
  onClose: () => void;
  onSave: (data: MenuItemData) => Promise<void>;
}

const ItemDialog = ({ open, item, categories, currency, onClose, onSave }: ItemDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_popular: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category_id: item.category_id,
        image_url: item.image_url || '',
        is_available: item.is_available,
        is_popular: item.is_popular,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        is_available: true,
        is_popular: false,
      });
    }
  }, [item, open, categories]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price || !formData.category_id) return;
    setSaving(true);
    await onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      category_id: formData.category_id,
      image_url: formData.image_url.trim() || null,
      is_available: formData.is_available,
      is_popular: formData.is_popular,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Margherita Pizza"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the dish"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price ({currency}) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Image URL (optional)</Label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Available</Label>
              <p className="text-xs text-muted-foreground">Show this item on the menu</p>
            </div>
            <Switch
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Popular</Label>
              <p className="text-xs text-muted-foreground">Highlight as a popular item</p>
            </div>
            <Switch
              checked={formData.is_popular}
              onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || !formData.price || !formData.category_id}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardMenu;
