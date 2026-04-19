import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api/client";

export type Course = {
  id: string;
  name_en: string;
  name_ar: string | null;
  code: string | null;
};

export type CatalogData = {
  universities: any[];
  colleges: any[];
  majors: any[];
  yearLevels: any[];
  courses: Course[];
};

export function useCatalog() {
  return useQuery<CatalogData>({
    queryKey: ["catalog"],
    queryFn: () => apiRequest<CatalogData>("/api/data/catalog")
  });
}
