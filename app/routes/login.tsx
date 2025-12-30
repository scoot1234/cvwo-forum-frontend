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
import { login } from "~/lib/api/auth";
import { useAuthUser } from "~/lib/hooks/useAuthUser";

export default function LoginRoute() {
    const navigate = useNavigate();
    const { mounted, setUser } = useAuthUser();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const u = username.trim();
        if (!u || !password) {
            setError("Username and password are required.");
            return;
        }

        try {
            setLoading(true);
            const user = await login(u, password);
            setUser(user);
            navigate("/", { replace: true });
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
                        Login
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back — jump into the discussion.
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
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    No account?{" "}
                    <Link component={RouterLink} to="/signup">
                        Sign up
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
                        You can browse without logging in.
                    </Typography>
                </Stack>
            </Paper>
        </Container>
    );
}
