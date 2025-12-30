import { api } from "~/lib/api/client";

export type CommentDTO = {
  id: number;
  postId: number;
  userId: number;
  body: string;
  parentCommentId?: number | null;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  author?: { id: number; username: string } | null;
};

export async function listCommentsByPost(postId: number) {
  const res = await api.get<CommentDTO[]>(`/posts/${postId}/comments`);
  return res.data;
}

export async function createComment(
  postId: number,
  input: { userId: number; body: string; parentCommentId?: number }
) {
  const res = await api.post<CommentDTO>(`/posts/${postId}/comments`, input);
  return res.data;
}

export async function patchComment(
  commentId: number,
  input: { userId: number; body?: string }
) {
  const res = await api.patch<CommentDTO>(`/comments/${commentId}`, input);
  return res.data;
}

export async function deleteComment(commentId: number, userId: number) {
  await api.delete(`/comments/${commentId}`, { data: { userId } });
}
