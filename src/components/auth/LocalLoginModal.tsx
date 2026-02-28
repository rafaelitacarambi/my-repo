import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User } from "lucide-react";
import { useMember } from "@/integrations";

interface LocalLoginModalProps {
    title?: string;
    message?: string;
}

export function LocalLoginModal({
    title = "Acesso Restrito",
    message = "Por favor, faça login para continuar."
}: LocalLoginModalProps) {
    const { actions } = useMember();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // @ts-ignore - We will add this method to the interface momentarily
            await actions.loginWithCredentials(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao realizar login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-secondary/20 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-2xl font-heading text-primary">{title}</CardTitle>
                <CardDescription className="text-center font-paragraph">
                    {message}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Login / Email</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                placeholder="Seu login ou email"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-secondary hover:bg-secondary/90 font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
