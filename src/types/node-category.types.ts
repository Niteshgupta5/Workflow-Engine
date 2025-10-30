export interface NodeCategoryDTO {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NodeTemplateDTO {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category_id: string | null;
}

export interface NodeCategoryWithTemplatesDTO extends NodeCategoryDTO {
  NodeTemplate: NodeTemplateDTO[];
}
