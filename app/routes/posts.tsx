import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { getApiErrorMessage } from "~/lib/api/client";
import { getTopicFromList, type TopicDTO } from "~/lib/api/topics";
import {
    createPost,
    deletePost,
    listPostsByTopic,
    patchPost,
    type PostDTO,
} from "~/lib/api/posts";
import { useAuthUser } from "~/lib/hooks/useAuthUser";

function fmtDate(s?: string | null) {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().replace("T", " ").slice(0, 16);
}

function isEdited(createdAt?: string, updatedAt?: string, editedAt?: string | null) {
    if (editedAt) return true;
    if (!createdAt || !updatedAt) return false;
    const a = new Date(createdAt).getTime();
    const b = new Date(updatedAt).getTime();
    return b - a > 1000;
}

function canDelete(user: { id: number; role: string } | null, ownerUserId: number) {
    if (!user) return false;
    return user.role === "admin" || user.role === "moderator" || user.id === ownerUserId;
}

function canEdit(user: { id: number } | null, ownerUserId: number) {
    if (!user) return false;
    return user.id === ownerUserId;
}

export default function TopicPostsRoute() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const topicIdNum = useMemo(() => Number(topicId), [topicId]);
    const { mounted, user, logout } = useAuthUser();

    const [topic, setTopic] = useState<TopicDTO | null>(null);
    const [posts, setPosts] = useState<PostDTO[]>([]);

    const [topicLoading, setTopicLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);
    const loading = topicLoading || postsLoading;

    const [err, setErr] = useState<string | null>(null);

    // Search query for posts
    const [query, setQuery] = useState("");

    // Create dialog state
    const [openCreate, setOpenCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBody, setNewBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    // Edit dialog state
    const [openEdit, setOpenEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editErr, setEditErr] = useState<string | null>(null);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Fetch topic once
    useEffect(() => {
        if (!topicIdNum || Number.isNaN(topicIdNum)) {
            setErr("Invalid topic id.");
            setTopicLoading(false);
            setPostsLoading(false);
            return;
        }

        let alive = true;

        (async () => {
            try {
                setTopicLoading(true);
                setErr(null);
                const t = await getTopicFromList(topicIdNum);
                if (!alive) return;
                setTopic(t);
            } catch (e) {
                if (!alive) return;
                setErr(getApiErrorMessage(e));
            } finally {
                if (!alive) return;
                setTopicLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [topicIdNum]);

    // Fetch posts whenever query changes (debounced)
    useEffect(() => {
        if (!topicIdNum || Number.isNaN(topicIdNum)) return;

        let alive = true;
        const handle = setTimeout(async () => {
            try {
                setPostsLoading(true);
                setErr(null);
                const p = await listPostsByTopic(topicIdNum, query); // ✅ calls backend with ?q=
                if (!alive) return;
                setPosts(p);
            } catch (e) {
                if (!alive) return;
                setErr(getApiErrorMessage(e));
            } finally {
                if (!alive) return;
                setPostsLoading(false);
            }
        }, 250);

        return () => {
            alive = false;
            clearTimeout(handle);
        };
    }, [topicIdNum, query]);

    function onClickAddPost() {
        if (!user) return navigate("/login");
        setNewTitle("");
        setNewBody("");
        setSaveErr(null);
        setOpenCreate(true);
    }

    async function onCreatePost() {
        if (!user) return;

        const t = newTitle.trim();
        const b = newBody.trim();

        if (!t) return setSaveErr("Title is required.");
        if (t.length > 120) return setSaveErr("Title too long (max 120).");
        if (!b) return setSaveErr("Body is required.");

        try {
            setSaving(true);
            setSaveErr(null);

            await createPost(topicIdNum, { userId: user.id, title: t, body: b });
            setOpenCreate(false);

            // Refresh list based on current query
            setPostsLoading(true);
            const p = await listPostsByTopic(topicIdNum, query);
            setPosts(p);
        } catch (e) {
            setSaveErr(getApiErrorMessage(e));
        } finally {
            setSaving(false);
            setPostsLoading(false);
        }
    }

    function onOpenEdit(p: PostDTO) {
        if (!user) return navigate("/login");
        if (!canEdit(user, p.userId)) return;

        setEditId(p.id);
        setEditTitle(p.title);
        setEditBody(p.body);
        setEditErr(null);
        setOpenEdit(true);
    }

    async function onSaveEdit() {
        if (!user || !editId) return;

        const t = editTitle.trim();
        const b = editBody.trim();

        if (!t) return setEditErr("Title is required.");
        if (t.length > 120) return setEditErr("Title too long (max 120).");
        if (!b) return setEditErr("Body is required.");

        try {
            setEditSaving(true);
            setEditErr(null);

            await patchPost(editId, { userId: user.id, title: t, body: b });
            setOpenEdit(false);

            // Refresh list based on current query (edits can affect search results)
            setPostsLoading(true);
            const p = await listPostsByTopic(topicIdNum, query);
            setPosts(p);
        } catch (e) {
            setEditErr(getApiErrorMessage(e));
        } finally {
            setEditSaving(false);
            setPostsLoading(false);
        }
    }

    async function onDeletePost(postId: number) {
        if (!user) return;

        const ok = typeof window !== "undefined" ? window.confirm("Delete this post?") : false;
        if (!ok) return;

        try {
            setDeletingId(postId);
            await deletePost(postId, user.id);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (e) {
            setErr(getApiErrorMessage(e));
        } finally {
            setDeletingId(null);
        }
    }

    const isSearching = query.trim().length > 0;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        component={RouterLink}
                        to="/"
                        sx={{ textDecoration: "none", color: "text.primary" }}
                    >
                        CVWO Forum
                    </Typography>

                    {mounted ? (
                        user ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label={user.username} />
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        logout();
                                        navigate("/", { replace: true });
                                    }}
                                >
                                    Logout
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" onClick={() => navigate("/login")}>
                                    Login
                                </Button>
                                <Button variant="contained" onClick={() => navigate("/signup")}>
                                    Sign up
                                </Button>
                            </Stack>
                        )
                    ) : (
                        <Skeleton variant="rounded" width={180} height={36} />
                    )}
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 6 }}>
                {loading ? (
                    <Stack spacing={2}>
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={20} />
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                    </Stack>
                ) : (
                    <>
                        <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
                            {topic?.title ?? `Topic #${topicIdNum}`}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {topic?.description ?? "No description."}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                            <Button variant="text" onClick={() => navigate("/")}>
                                ← Back to topics
                            </Button>
                        </Stack>

                        {/* Search + Add */}
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, mb: 3 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    fullWidth
                                    placeholder="Search posts…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <IconButton
                                    onClick={onClickAddPost}
                                    color="primary"
                                    sx={{ borderRadius: 2, width: 48, height: 48, flex: "0 0 auto" }}
                                    aria-label="Add post"
                                >
                                    <AddIcon />
                                </IconButton>
                            </Stack>
                        </Paper>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" fontWeight={800}>
                                Posts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {posts.length} post{posts.length === 1 ? "" : "s"}
                            </Typography>
                        </Stack>

                        {err && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {err}
                            </Alert>
                        )}

                        {postsLoading ? (
                            <Stack spacing={2}>
                                <Skeleton variant="rounded" height={72} />
                                <Skeleton variant="rounded" height={72} />
                                <Skeleton variant="rounded" height={72} />
                            </Stack>
                        ) : posts.length === 0 ? (
                            <Paper sx={{ p: 3, borderRadius: 3 }}>
                                <Typography fontWeight={800}>
                                    {isSearching ? "No matches" : "No posts yet"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isSearching
                                        ? "Try a different keyword."
                                        : "Be the first to post in this topic."}
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={2}>
                                {posts.map((p) => (
                                    <Paper
                                        key={p.id}
                                        sx={{ p: 2.5, borderRadius: 3, cursor: "pointer", "&:hover": { boxShadow: 2 } }}
                                        onClick={() => navigate(`/posts/${p.id}`)}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ pr: 2, flex: 1 }}>
                                                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                                                    {p.title}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                    {p.author?.username ?? `User #${p.userId}`} • {fmtDate(p.createdAt)}
                                                    {isEdited(p.createdAt, p.updatedAt, p.editedAt) ? " · Edited" : ""}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    {p.body.length > 160 ? p.body.slice(0, 160) + "…" : p.body}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={0.5}>
                                                {canEdit(user, p.userId) ? (
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenEdit(p);
                                                        }}
                                                        aria-label="Edit post"
                                                    >
                                                        <EditOutlinedIcon />
                                                    </IconButton>
                                                ) : null}

                                                {canDelete(user, p.userId) ? (
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeletePost(p.id);
                                                        }}
                                                        disabled={deletingId === p.id}
                                                        aria-label="Delete post"
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                ) : null}
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </>
                )}
            </Container>

            {/* Create Post Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm" keepMounted>
                <DialogTitle>Create a post</DialogTitle>
                <DialogContent>
                    {saveErr && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {saveErr}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        fullWidth
                        label="Title"
                        margin="normal"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Body"
                        margin="normal"
                        multiline
                        minRows={4}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={onCreatePost} variant="contained" disabled={saving}>
                        {saving ? "Posting..." : "Post"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Post Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm" keepMounted>
                <DialogTitle>Edit post</DialogTitle>
                <DialogContent>
                    {editErr && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {editErr}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        fullWidth
                        label="Title"
                        margin="normal"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Body"
                        margin="normal"
                        multiline
                        minRows={4}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)} disabled={editSaving}>
                        Cancel
                    </Button>
                    <Button onClick={onSaveEdit} variant="contained" disabled={editSaving}>
                        {editSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
