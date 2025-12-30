import { api } from "~/lib/api/client";

export type PostDTO = {
  id: number;
  topicId: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  author?: { id: number; username: string } | null;
};

export async function listPostsByTopic(topicId: number) {
  const res = await api.get<PostDTO[]>(`/topics/${topicId}/posts`);
  return res.data;
}

export async function createPost(
  topicId: number,
  input: { userId: number; title: string; body: string }
) {
  const res = await api.post<PostDTO>(`/topics/${topicId}/posts`, input);
  return res.data;
}

export async function getPostById(postId: number) {
  const res = await api.get<PostDTO>(`/posts/${postId}`);
  return res.data;
}

export async function patchPost(
  postId: number,
  input: { userId: number; title?: string; body?: string }
) {
  const res = await api.patch<PostDTO>(`/posts/${postId}`, input);
  return res.data;
}

export async function deletePost(postId: number, userId: number) {
  await api.delete(`/posts/${postId}`, { data: { userId } });
}
