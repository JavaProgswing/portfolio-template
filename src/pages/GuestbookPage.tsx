import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const MotionBox = motion(Box);

// API base — change to /api/portfolio when deployed behind nginx
const API_BASE = "/api/portfolio";

interface GuestEntry {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const GuestbookPage = () => {
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const toast = useToast();
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/guestbook?limit=30`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setEntries(Array.isArray(d) ? d : []);
        setAvailable(true);
      })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error("submit_failed");
      setName("");
      setMessage("");
      toast({
        title: "✓ message posted",
        status: "success",
        duration: 2500,
        position: "bottom-left",
        variant: "subtle",
      });
      load();
    } catch {
      toast({
        title: "couldn't post",
        description: "backend may be offline",
        status: "error",
        duration: 3000,
        position: "bottom-left",
        variant: "subtle",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} py={20}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Guestbook
      </Text>
      <Heading size="lg" mb={3}>Sign the Wall</Heading>
      <Text fontSize="md" color="gray.400" mb={10} maxW="600px" lineHeight="1.75">
        Leave a note. Be kind. Messages are public and stored on my server.
      </Text>

      {/* Form */}
      <Box
        p={5} borderRadius="12px" layerStyle="card" border="1px solid" borderColor={border}
        mb={10}
      >
        <Stack spacing={3}>
          <Input
            placeholder="your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            size="sm"
            fontSize="sm"
            isDisabled={submitting || available === false}
          />
          <Textarea
            placeholder="your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            size="sm"
            fontSize="sm"
            rows={3}
            resize="vertical"
            isDisabled={submitting || available === false}
          />
          <HStack justify="space-between">
            <Text fontSize="11px" color="gray.600" fontFamily="mono">
              {message.length}/500
            </Text>
            <Button
              onClick={submit}
              size="sm"
              variant="glow"
              isLoading={submitting}
              isDisabled={!name.trim() || !message.trim() || available === false}
            >
              sign
            </Button>
          </HStack>
        </Stack>
      </Box>

      {/* Entries */}
      {available === false ? (
        <Box p={4} layerStyle="card" border="1px solid" borderColor={border} borderRadius="10px">
          <Text fontSize="sm" color="gray.500">
            Guestbook backend is offline. Make sure the FastAPI service is running:{" "}
            <Text as="code" color="brand.400">systemctl status portfolio-api</Text>
          </Text>
        </Box>
      ) : loading ? (
        <Text fontSize="sm" color="gray.500" fontFamily="mono">loading entries…</Text>
      ) : entries.length === 0 ? (
        <Text fontSize="sm" color="gray.500" fontFamily="mono" textAlign="center" py={6}>
          no entries yet · be the first
        </Text>
      ) : (
        <Stack spacing={3}>
          {entries.map((entry, i) => (
            <MotionBox
              key={entry.id}
              p={4} borderRadius="10px" layerStyle="card"
              border="1px solid" borderColor={border}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <HStack justify="space-between" mb={1.5}>
                <Text fontSize="sm" fontWeight="600" color="gray.100">
                  {entry.name}
                </Text>
                <Text fontSize="10px" color="gray.600" fontFamily="mono">
                  {formatDate(entry.created_at)}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap" lineHeight="1.65">
                {entry.message}
              </Text>
            </MotionBox>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default GuestbookPage;
