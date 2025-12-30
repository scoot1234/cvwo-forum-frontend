import { api } from "~/lib/api/client";

export type TopicDTO = {
  id: number;
  title: string;
  description: string;
  createdByUserId?: number | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; username: string } | null;
};

export async function listTopics() {
  const res = await api.get<TopicDTO[]>("/topics");
  return res.data;
}

export async function createTopic(input: {
  title: string;
  description: string;
  userId: number;
}) {
  const res = await api.post<TopicDTO>("/topics", input);
  return res.data;
}

export async function getTopicFromList(topicId: number) {
  const topics = await listTopics();
  return topics.find((t) => t.id === topicId) ?? null;
}
