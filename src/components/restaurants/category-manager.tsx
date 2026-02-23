"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} from "@/lib/api";
import {
  suggestCategoriesFromAI,
  suggestCategoriesByPrefix,
  type AISuggestion,
} from "@/app/actions/ai";
import { MenuCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CategoryManagerProps {
  restaurantId: string;
  onCategoriesChange?: () => void;
}

const AFRICAN_CUISINES = [
  "North African",
  "West African",
  "East African",
  "Central African",
  "Southern African",
  "Ethiopian",
  "Moroccan",
  "Nigerian",
  "South African",
  "Somali",
];

export function CategoryManager({
  restaurantId,
  onCategoriesChange,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI states
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const aiSuggestionsRef = useRef<AISuggestion[]>([]);

  // Prefix AI states
  const [prefixSuggestions, setPrefixSuggestions] = useState<AISuggestion[]>(
    [],
  );
  const prefixSuggestionsRef = useRef<AISuggestion[]>([]);
  const [isPrefixLoading, setIsPrefixLoading] = useState(false);
  // True right after a suggestion is selected — suppresses the next prefix call
  const justSelectedRef = useRef(false);

  // Keep refs in sync so the effect can read latest values without them being deps
  useEffect(() => {
    prefixSuggestionsRef.current = prefixSuggestions;
  }, [prefixSuggestions]);
  useEffect(() => {
    aiSuggestionsRef.current = aiSuggestions;
  }, [aiSuggestions]);

  useEffect(() => {
    if (!selectedCuisine || !name || name.trim().length === 0) {
      if (prefixSuggestionsRef.current.length > 0) {
        setPrefixSuggestions([]);
      }
      return;
    }

    // Skip if name was just set by selecting a suggestion (not by typing)
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    // Read latest values via refs — no reactivity needed here
    if (
      prefixSuggestionsRef.current.some((s) => s.name === name) ||
      aiSuggestionsRef.current.some((s) => s.name === name)
    ) {
      return;
    }

    const timerId = setTimeout(async () => {
      setIsPrefixLoading(true);
      try {
        const result = await suggestCategoriesByPrefix(selectedCuisine, name);
        if (result.success) {
          setPrefixSuggestions(result.data);
          prefixSuggestionsRef.current = result.data;
        }
      } catch (err: any) {
        console.error("Failed to fetch prefix suggestions", err);
      } finally {
        setIsPrefixLoading(false);
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [name, selectedCuisine]); // ✅ only real triggers — no array state deps

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getMenuCategories(restaurantId);
      setCategories(res.data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load categories",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      fetchCategories();
    }
  }, [isDialogOpen, restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMenuCategory(editingId, { name, description });
        toast({ title: "Category updated successfully" });
      } else {
        await createMenuCategory({
          restaurant_id: restaurantId,
          name,
          description,
        });
        toast({ title: "Category created successfully" });
      }
      resetForm();
      fetchCategories();
      if (onCategoriesChange) onCategoriesChange();
    } catch (err: any) {
      toast({
        title: "Operation failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteMenuCategory(id);
      toast({ title: "Category deleted" });
      fetchCategories();
      if (onCategoriesChange) onCategoriesChange();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cat: MenuCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const handleGenerateAI = async () => {
    if (!selectedCuisine) return;
    setIsAiLoading(true);
    try {
      const result = await suggestCategoriesFromAI(selectedCuisine);
      if (result.success) {
        setAiSuggestions(result.data);
        toast({ title: "AI suggestions generated!" });
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast({
        title: "AI Generation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const useSuggestion = (suggestion: AISuggestion) => {
    justSelectedRef.current = true; // prevent prefix call on the resulting name change
    setName(suggestion.name);
    setDescription(suggestion.description || "");
    setEditingId(null);
    setPrefixSuggestions([]);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Category Management</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" /> AI Setup Assistant
              </h3>
              <div className="space-y-3">
                <Select
                  value={selectedCuisine}
                  onValueChange={setSelectedCuisine}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an African Cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_CUISINES.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerateAI}
                  disabled={!selectedCuisine || isAiLoading}
                  className="w-full"
                >
                  {isAiLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Get AI Suggestions
                </Button>

                {aiSuggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {aiSuggestions.map((sug, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                        onClick={() => useSuggestion(sug)}
                        title={sug.description}
                      >
                        {sug.name} <Plus className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 border rounded-lg p-4"
            >
              <h3 className="font-semibold">
                {editingId ? "Edit Category" : "Add New Category"}
              </h3>
              <div className="space-y-2 relative">
                <Label htmlFor="category-name">Name</Label>
                <div className="relative">
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => {
                      justSelectedRef.current = false; // user is typing — allow new prefix calls
                      setName(e.target.value);
                    }}
                    placeholder="e.g. Starters"
                    required
                  />
                  {isPrefixLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {prefixSuggestions.length > 0 && selectedCuisine && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {prefixSuggestions.map((sug, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-white transition-colors border-primary/40 text-primary bg-primary/5 shadow-sm"
                        onClick={() => useSuggestion(sug)}
                        title={sug.description}
                      >
                        {sug.name} <Plus className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                {selectedCuisine &&
                  !isPrefixLoading &&
                  prefixSuggestions.length === 0 &&
                  name.length > 0 &&
                  !aiSuggestions.some((s) => s.name === name) && (
                    <p className="text-[10px] text-muted-foreground">
                      Type to get AI category suggestions based on chosen
                      cuisine.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-desc">Description</Label>
                <Textarea
                  id="category-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !name}
                  className="flex-1"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Update" : "Add Category"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">
              Existing Categories ({categories.length})
            </h3>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center p-8 border border-dashed rounded-md">
                No categories found. Use the AI assistant or add one manually.
              </p>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-start p-3 border rounded-md group hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{cat.name}</h4>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(cat)}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
