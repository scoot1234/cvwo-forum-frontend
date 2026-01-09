import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { getApiErrorMessage } from "~/lib/api/client";
import { getPostById, patchPost, type PostDTO } from "~/lib/api/posts";
import {
    createComment,
    deleteComment,
    listCommentsByPost,
    patchComment,
    type CommentDTO,
} from "~/lib/api/comments";
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

export default function CommentsRoute() {
    const { postId } = useParams();
    const postIdNum = useMemo(() => Number(postId), [postId]);
    const navigate = useNavigate();
    const { mounted, user, logout } = useAuthUser();

    const [post, setPost] = useState<PostDTO | null>(null);
    const [comments, setComments] = useState<CommentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [newBody, setNewBody] = useState("");
    const [posting, setPosting] = useState(false);

    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [editCommentBody, setEditCommentBody] = useState("");
    const [editCommentSaving, setEditCommentSaving] = useState(false);

    const [editingPost, setEditingPost] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState("");
    const [editPostBody, setEditPostBody] = useState("");
    const [editPostSaving, setEditPostSaving] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (!postIdNum || Number.isNaN(postIdNum)) {
            setErr("Invalid post id.");
            setLoading(false);
            return;
        }

        let alive = true;

        async function run() {
            try {
                setLoading(true);
                setErr(null);

                const [p, cs] = await Promise.all([getPostById(postIdNum), listCommentsByPost(postIdNum)]);
                if (!alive) return;

                setPost(p);
                setComments(cs);
                setEditPostTitle(p.title);
                setEditPostBody(p.body);
            } catch (e) {
                if (!alive) return;
                setErr(getApiErrorMessage(e));
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }

        run();
        return () => {
            alive = false;
        };
    }, [postIdNum]);

    async function submitComment() {
        if (!user) return navigate("/login");
        const b = newBody.trim();
        if (!b) return;

        try {
            setPosting(true);
            const created = await createComment(postIdNum, { userId: user.id, body: b });
            setComments((prev) => [...prev, created]);
            setNewBody("");
        } catch (e) {
            setErr(getApiErrorMessage(e));
        } finally {
            setPosting(false);
        }
    }

    function startEditComment(c: CommentDTO) {
        if (!user) return navigate("/login");
        if (!canEdit(user, c.userId)) return;
        setEditCommentId(c.id);
        setEditCommentBody(c.body);
    }

    async function saveEditComment() {
        if (!user || !editCommentId) return;
        const b = editCommentBody.trim();
        if (!b) return;

        try {
            setEditCommentSaving(true);
            const updated = await patchComment(editCommentId, { userId: user.id, body: b });
            setComments((prev) => prev.map((x) => (x.id === editCommentId ? updated : x)));
            setEditCommentId(null);
            setEditCommentBody("");
        } catch (e) {
            setErr(getApiErrorMessage(e));
        } finally {
            setEditCommentSaving(false);
        }
    }

    function cancelEditComment() {
        setEditCommentId(null);
        setEditCommentBody("");
    }

    function startEditPost() {
        if (!user) return navigate("/login");
        if (!post) return;
        if (!canEdit(user, post.userId)) return;
        setEditPostTitle(post.title);
        setEditPostBody(post.body);
        setEditingPost(true);
    }

    async function saveEditPost() {
        if (!user || !post) return;
        const t = editPostTitle.trim();
        const b = editPostBody.trim();
        if (!t || !b) return;

        try {
            setEditPostSaving(true);
            const updated = await patchPost(post.id, { userId: user.id, title: t, body: b });
            setPost(updated);
            setEditingPost(false);
        } catch (e) {
            setErr(getApiErrorMessage(e));
        } finally {
            setEditPostSaving(false);
        }
    }

    async function onDeleteComment(commentId: number) {
        if (!user) return;

        const ok = typeof window !== "undefined" ? window.confirm("Delete this comment?") : false;
        if (!ok) return;

        try {
            setDeletingId(commentId);
            await deleteComment(commentId, user.id);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (e) {
            setErr(getApiErrorMessage(e));
        } finally {
            setDeletingId(null);
        }
    }

    function jumpToComment(commentId: number) {
        if (typeof window === "undefined") return;
        window.location.hash = `comment-${commentId}`;
        const el = document.getElementById(`comment-${commentId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

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
                                <Button variant="outlined" component={RouterLink} to="/login">
                                    Login
                                </Button>
                                <Button variant="contained" component={RouterLink} to="/signup">
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
                        <Skeleton variant="rounded" height={120} />
                        <Skeleton variant="rounded" height={80} />
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                    </Stack>
                ) : (
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        {!editingPost ? (
                            <>
                                <Typography variant="h5" fontWeight={900}>
                                    {post?.title ?? `Post #${postIdNum}`}
                                </Typography>

                                <Typography sx={{ mt: 1 }}>{post?.body ?? "No content."}</Typography>

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                                    {post?.author?.username ?? `User #${post?.userId ?? "?"}`} •{" "}
                                    {post?.createdAt ? fmtDate(post.createdAt) : ""}
                                    {post && isEdited(post.createdAt, post.updatedAt, post.editedAt) ? " · Edited" : ""}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => (post?.topicId ? navigate(`/topics/${post.topicId}`) : navigate("/"))}
                                    >
                                        ← Back to topic
                                    </Button>
                                    {post && canEdit(user, post.userId) ? (
                                        <Button variant="contained" onClick={startEditPost} startIcon={<EditOutlinedIcon />}>
                                            Edit post
                                        </Button>
                                    ) : null}
                                </Stack>
                            </>
                        ) : (
                            <>
                                <Typography variant="h6" fontWeight={900}>
                                    Edit post
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    margin="normal"
                                    value={editPostTitle}
                                    onChange={(e) => setEditPostTitle(e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Body"
                                    margin="normal"
                                    multiline
                                    minRows={5}
                                    value={editPostBody}
                                    onChange={(e) => setEditPostBody(e.target.value)}
                                />
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Button variant="contained" onClick={saveEditPost} disabled={editPostSaving}>
                                        {editPostSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setEditingPost(false);
                                            if (post) {
                                                setEditPostTitle(post.title);
                                                setEditPostBody(post.body);
                                            }
                                        }}
                                        disabled={editPostSaving}
                                    >
                                        Cancel
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Paper>
                )}

                {err && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {err}
                    </Alert>
                )}

                <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
                    <Typography fontWeight={800} sx={{ mb: 1 }}>
                        Add a comment
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder={user ? "Write something…" : "Login to comment…"}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        disabled={!mounted || !user}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
                        <Button variant="contained" onClick={submitComment} disabled={!user || posting}>
                            {posting ? "Posting..." : "Comment"}
                        </Button>
                        {!user ? (
                            <Button variant="outlined" onClick={() => navigate("/login")}>
                                Login
                            </Button>
                        ) : null}
                    </Stack>
                </Paper>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Comments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {comments.length} comment{comments.length === 1 ? "" : "s"}
                    </Typography>
                </Stack>

                {loading ? (
                    <Stack spacing={2}>
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                    </Stack>
                ) : comments.length === 0 ? (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography fontWeight={700}>No comments yet</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Be the first to comment.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {comments.map((c) => {
                            const isEditOpen = editCommentId === c.id;

                            return (
                                <Paper key={c.id} id={`comment-${c.id}`} sx={{ p: 2.5, borderRadius: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" fontWeight={800}>
                                                {c.author?.username ?? `User #${c.userId}`} • {fmtDate(c.createdAt)}
                                                {isEdited(c.createdAt, c.updatedAt, c.editedAt) ? " · Edited" : ""}
                                            </Typography>

                                            <Divider sx={{ my: 1.25 }} />

                                            {!isEditOpen ? (
                                                <Typography>{c.body}</Typography>
                                            ) : (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={3}
                                                        value={editCommentBody}
                                                        onChange={(e) => setEditCommentBody(e.target.value)}
                                                    />
                                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                        <Button variant="contained" onClick={saveEditComment} disabled={editCommentSaving}>
                                                            {editCommentSaving ? "Saving..." : "Save"}
                                                        </Button>
                                                        <Button variant="outlined" onClick={cancelEditComment} disabled={editCommentSaving}>
                                                            Cancel
                                                        </Button>
                                                    </Stack>
                                                </>
                                            )}
                                        </Box>

                                        <Stack direction="column" spacing={0.5} sx={{ flex: "0 0 auto" }}>

                                            {canEdit(user, c.userId) ? (
                                                <IconButton onClick={() => startEditComment(c)} aria-label="Edit comment">
                                                    <EditOutlinedIcon />
                                                </IconButton>
                                            ) : null}

                                            {canDelete(user, c.userId) ? (
                                                <IconButton
                                                    onClick={() => onDeleteComment(c.id)}
                                                    disabled={deletingId === c.id}
                                                    aria-label="Delete comment"
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Container>
        </Box>
    );
}
