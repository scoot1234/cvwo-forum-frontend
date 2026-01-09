import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Stack,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

import { getApiErrorMessage } from "~/lib/api/client";
import { createTopic, listTopics, type TopicDTO } from "~/lib/api/topics";
import { useAuthUser } from "~/lib/hooks/useAuthUser";

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function TopicsHome() {
  const navigate = useNavigate();
  const { mounted, user, logout } = useAuthUser();

  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await listTopics(query);
        if (!alive) return;

        setTopics(data);
      } catch (e) {
        if (!alive) return;
        setLoadError(getApiErrorMessage(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [query]);

  function onClickNewTopic() {
    if (!user) return navigate("/login");
    setTitle("");
    setDescription("");
    setSaveError(null);
    setOpen(true);
  }

  async function onCreateTopic() {
    if (!user) return;

    const t = title.trim();
    const d = description.trim();

    if (!t) return setSaveError("Title is required.");
    if (t.length > 100) return setSaveError("Title too long (max 100).");
    if (d.length > 500) return setSaveError("Description too long (max 500).");

    try {
      setSaving(true);
      setSaveError(null);

      await createTopic({ title: t, description: d, userId: user.id });
      setOpen(false);

      setLoading(true);
      setLoadError(null);
      const data = await listTopics(query);
      setTopics(data);
    } catch (e) {
      setSaveError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
      setLoading(false);
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
        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={900} align="center">
            Find your people.
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Browse topics, jump into discussions, or start a new one.
          </Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search topics…"
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
              onClick={onClickNewTopic}
              color="primary"
              sx={{ borderRadius: 2, width: 48, height: 48, flex: "0 0 auto" }}
              aria-label="New topic"
            >
              <AddIcon />
            </IconButton>
          </Stack>
        </Paper>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 4, mb: 1 }}
        >
          <Typography variant="h6" fontWeight={800}>
            Featured topics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {topics.length} topic{topics.length === 1 ? "" : "s"}
          </Typography>
        </Stack>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={72} />
          </Stack>
        ) : topics.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={700}>
              {isSearching ? "No matches" : "No topics yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSearching ? "Try a different keyword." : "Be the first to create a topic."}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {topics.map((t) => {
              const hasAuthor = !!t.author?.username;

              return (
                <Paper
                  key={t.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    cursor: "pointer",
                    "&:hover": { boxShadow: 2 },
                  }}
                  onClick={() => navigate(`/topics/${t.id}`)}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={800}>
                      {t.title}
                    </Typography>
                    {!t.createdByUserId && (
                      <Chip size="small" label="Official" variant="outlined" />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {t.description || "No description."}
                  </Typography>

                  {hasAuthor ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      by {t.author!.username} • {formatDate(t.createdAt)}
                    </Typography>
                  ) : null}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create a new topic</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Title"
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            label="Description (optional)"
            margin="normal"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onCreateTopic} variant="contained" disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
