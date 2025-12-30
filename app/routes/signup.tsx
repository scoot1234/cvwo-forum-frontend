import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
    Alert,
    Box,
    Button,
    Container,
    Divider,
    Link,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { getApiErrorMessage } from "~/lib/api/client";
import { signup } from "~/lib/api/auth";
import { useAuthUser } from "~/lib/hooks/useAuthUser";

export default function SignupRoute() {
    const navigate = useNavigate();
    const { mounted } = useAuthUser();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const u = username.trim();
        if (!u) return setError("Username is required.");
        if (u.length > 32) return setError("Username too long (max 32).");
        if (!password || password.length < 8) return setError("Password must be at least 8 characters.");

        try {
            setLoading(true);
            await signup(u, password);
            navigate("/login", { replace: true });
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) {
        return (
            <Container maxWidth="xs" sx={{ mt: 8 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Loading…
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={900}>
                        Sign up
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create an account to post and comment.
                    </Typography>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />

                    <TextField
                        label="Password (min 8 chars)"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />

                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
                        {loading ? "Creating..." : "Create account"}
                    </Button>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Already have an account?{" "}
                    <Link component={RouterLink} to="/login">
                        Login
                    </Link>
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="hover"
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
                    >
                        <ArrowBackIcon fontSize="small" />
                        Back to topics
                    </Link>

                    <Typography variant="caption" color="text.secondary">
                        Browsing works without an account.
                    </Typography>
                </Stack>
            </Paper>
        </Container>
    );
}
