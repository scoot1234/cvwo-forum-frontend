import { api } from "~/lib/api/client";

export type CommentDTO = {
  id: number;
  postId: number;
  userId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  author?: { id: number; username: string } | null;
};

export async function listCommentsByPost(postId: number) {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data as CommentDTO[];
}

export async function createComment(
  postId: number,
  input: { userId: number; body: string }
) {
  const res = await api.post(`/posts/${postId}/comments`, input);
  return res.data as CommentDTO;
}

export async function patchComment(
  commentId: number,
  input: { userId: number; body?: string }
) {
  const res = await api.patch(`/comments/${commentId}`, input);
  return res.data as CommentDTO;
}

export async function deleteComment(commentId: number, userId: number) {
  await api.delete(`/comments/${commentId}`, { data: { userId } });
}
