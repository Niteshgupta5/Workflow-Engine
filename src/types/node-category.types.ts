export interface NodeCategoryDTO {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NodeCategoryWithTemplatesDTO extends NodeCategoryDTO {
  NodeTemplate: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    category_id: string | null;
  }[];
}
