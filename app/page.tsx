"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Download,
  Grid2X2,
  Heart,
  Lightbulb,
  List,
  MoreHorizontal,
  Palette,
  Pencil,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";

type Mood = "spark" | "calm" | "joy" | "focus";
type NoteColor = "peach" | "lemon" | "mint" | "lilac" | "sky";
type ViewMode = "grid" | "timeline";
type Filter = "all" | "pinned" | Mood;

type Note = {
  id: string;
  title: string;
  body: string;
  mood: Mood;
  color: NoteColor;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "mosaic-notes-v1";

const moodDetails: Record<
  Mood,
  { label: string; emoji: string; icon: typeof Lightbulb }
> = {
  spark: { label: "Inspired", emoji: "✦", icon: Lightbulb },
  calm: { label: "Calm", emoji: "◡", icon: Heart },
  joy: { label: "Happy", emoji: "☀", icon: Star },
  focus: { label: "Focused", emoji: "●", icon: Check },
};

const noteColors: Array<{ value: NoteColor; label: string }> = [
  { value: "peach", label: "Peach" },
  { value: "lemon", label: "Lemon" },
  { value: "mint", label: "Mint" },
  { value: "lilac", label: "Lilac" },
  { value: "sky", label: "Sky" },
];

const starterNotes: Note[] = [
  {
    id: "welcome-note",
    title: "Ideas deserve more than a blank page",
    body: "Capture the feeling behind a thought. Add a mood, choose a colour, and let your memory recognise it before you even read it.",
    mood: "spark",
    color: "lemon",
    tags: ["welcome", "idea"],
    pinned: true,
    createdAt: "2026-08-30T08:00:00.000Z",
    updatedAt: "2026-08-30T08:00:00.000Z",
  },
  {
    id: "weekend-note",
    title: "A softer weekend",
    body: "Long walk before breakfast\nCall home\nPut the phone away for one hour\nCook something new",
    mood: "calm",
    color: "mint",
    tags: ["personal", "weekend"],
    pinned: false,
    createdAt: "2026-08-29T16:30:00.000Z",
    updatedAt: "2026-08-29T16:30:00.000Z",
  },
  {
    id: "project-note",
    title: "The tiny-project rule",
    body: "Build the smallest useful version first. If someone can use it in under a minute, the idea is ready to grow.",
    mood: "focus",
    color: "lilac",
    tags: ["work", "principle"],
    pinned: false,
    createdAt: "2026-08-28T10:15:00.000Z",
    updatedAt: "2026-08-28T10:15:00.000Z",
  },
  {
    id: "bright-note",
    title: "Good things from today",
    body: "A kind message. Fresh coffee. Finished the difficult task. Remembered to pause.",
    mood: "joy",
    color: "peach",
    tags: ["gratitude"],
    pinned: false,
    createdAt: "2026-08-27T18:45:00.000Z",
    updatedAt: "2026-08-27T18:45:00.000Z",
  },
];

const emptyDraft = {
  title: "",
  body: "",
  mood: "spark" as Mood,
  color: "lemon" as NoteColor,
  tags: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, hydrated]);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes
      .filter((note) => {
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "pinned"
              ? note.pinned
              : note.mood === filter;
        const searchable = [note.title, note.body, ...note.tags]
          .join(" ")
          .toLowerCase();
        return matchesFilter && (!query || searchable.includes(query));
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      });
  }, [filter, notes, search]);

  const openNewNote = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorOpen(true);
  };

  const openEditNote = (note: Note) => {
    setEditingId(note.id);
    setDraft({
      title: note.title,
      body: note.body,
      mood: note.mood,
      color: note.color,
      tags: note.tags.join(", "),
    });
    setEditorOpen(true);
  };

  const saveNote = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() && !draft.body.trim()) {
      toast.error("Write a title or thought before saving.");
      return;
    }

    const now = new Date().toISOString();
    const tags = draft.tags
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 5);

    if (editingId) {
      setNotes((current) =>
        current.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: draft.title.trim() || "Untitled thought",
                body: draft.body.trim(),
                mood: draft.mood,
                color: draft.color,
                tags,
                updatedAt: now,
              }
            : note,
        ),
      );
      toast.success("Memory updated");
    } else {
      setNotes((current) => [
        {
          id: crypto.randomUUID(),
          title: draft.title.trim() || "Untitled thought",
          body: draft.body.trim(),
          mood: draft.mood,
          color: draft.color,
          tags,
          pinned: false,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
      toast.success("Thought captured");
    }
    setEditorOpen(false);
  };

  const togglePin = (id: string) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? { ...note, pinned: !note.pinned, updatedAt: new Date().toISOString() }
          : note,
      ),
    );
  };

  const removeNote = () => {
    if (!deleteId) return;
    setNotes((current) => current.filter((note) => note.id !== deleteId));
    setDeleteId(null);
    toast.success("Note removed");
  };

  const installApp = async () => {
    if (!installPrompt) {
      toast("Open your browser menu and choose “Add to Home screen”.");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") toast.success("Mosaic is ready on your device");
    setInstallPrompt(null);
  };

  const heading =
    filter === "all"
      ? "Memory mosaic"
      : filter === "pinned"
        ? "Pinned memories"
        : `${moodDetails[filter].label} memories`;

  return (
    <>
      <Toaster richColors position="top-center" />

      <main className="app-shell">
        <aside className="desktop-sidebar" aria-label="Notes navigation">
        <Brand />
        <Button className="new-note-button" onClick={openNewNote}>
          <Plus aria-hidden="true" /> New memory
        </Button>

        <nav className="side-nav">
          <FilterButton
            active={filter === "all"}
            icon={<Grid2X2 />}
            label="All memories"
            count={notes.length}
            onClick={() => setFilter("all")}
          />
          <FilterButton
            active={filter === "pinned"}
            icon={<Pin />}
            label="Pinned"
            count={notes.filter((note) => note.pinned).length}
            onClick={() => setFilter("pinned")}
          />
        </nav>

        <div className="mood-nav">
          <p className="nav-label">By feeling</p>
          {(Object.keys(moodDetails) as Mood[]).map((mood) => (
            <FilterButton
              key={mood}
              active={filter === mood}
              icon={<span className={`mood-dot ${mood}`} />}
              label={moodDetails[mood].label}
              count={notes.filter((note) => note.mood === mood).length}
              onClick={() => setFilter(mood)}
            />
          ))}
        </div>

        <div className="offline-card">
          <span className="offline-icon"><WifiOff aria-hidden="true" /></span>
          <div><strong>Yours, even offline</strong><p>Memories stay on this device.</p></div>
          <Button variant="outline" size="sm" onClick={installApp}>
            <Download aria-hidden="true" /> Install app
          </Button>
        </div>
        </aside>

        <section className="workspace">
        <header className="mobile-header">
          <Brand />
          <Button size="icon" className="mobile-add" onClick={openNewNote} aria-label="Create a note">
            <Plus />
          </Button>
        </header>

        <div className="workspace-top">
          <div>
            <p className="eyebrow">Your visual memory</p>
            <h1>What’s on your mind?</h1>
            <p className="subtitle">Give every thought a feeling, colour, and place to return to.</p>
          </div>
          <Button variant="outline" className="install-top" onClick={installApp}>
            <Download aria-hidden="true" /> Install
          </Button>
        </div>

        <button className="quick-capture" onClick={openNewNote}>
          <span className="capture-spark"><Sparkles aria-hidden="true" /></span>
          <span><strong>Capture a thought</strong><small>Write now. Add the feeling while it’s fresh.</small></span>
          <Plus className="capture-plus" aria-hidden="true" />
        </button>

        <div className="toolbar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search memories</span>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search words, feelings, tags…"
            />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search"><X /></button>}
          </label>

          <div className="mobile-filters" aria-label="Filter notes">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            <button className={filter === "pinned" ? "active" : ""} onClick={() => setFilter("pinned")}>Pinned</button>
            {(Object.keys(moodDetails) as Mood[]).map((mood) => (
              <button key={mood} className={filter === mood ? "active" : ""} onClick={() => setFilter(mood)}>
                {moodDetails[mood].emoji} {moodDetails[mood].label}
              </button>
            ))}
          </div>

          <div className="view-switch" aria-label="Change note view">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 /></button>
            <button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")} aria-label="Timeline view"><List /></button>
          </div>
        </div>

        <div className="section-heading">
          <div><h2>{heading}</h2><span>{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}</span></div>
          <p><Clock3 aria-hidden="true" /> Saved automatically</p>
        </div>

        {visibleNotes.length > 0 ? (
          <div className={view === "grid" ? "notes-grid" : "notes-timeline"}>
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                view={view}
                onEdit={() => openEditNote(note)}
                onPin={() => togglePin(note.id)}
                onDelete={() => setDeleteId(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span><Palette aria-hidden="true" /></span>
            <h3>No memory found</h3>
            <p>Try another word or capture a new thought in this space.</p>
            <Button onClick={openNewNote}><Plus /> Create a note</Button>
          </div>
        )}
        </section>
      </main>

      <NoteEditor
        open={editorOpen}
        editing={Boolean(editingId)}
        draft={draft}
        onOpenChange={setEditorOpen}
        onDraftChange={setDraft}
        onSubmit={saveNote}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this memory?</AlertDialogTitle>
            <AlertDialogDescription>This note will be deleted from this device and cannot be restored.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="delete-action" onClick={removeNote}>Delete note</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Mosaic Notes">
      <span className="brand-mark"><span /><span /><span /><span /></span>
      <span><strong>Mosaic</strong><small>notes that feel familiar</small></span>
    </div>
  );
}

function FilterButton({ active, icon, label, count, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button className={`filter-button ${active ? "active" : ""}`} onClick={onClick}>
      <span className="filter-icon">{icon}</span><span>{label}</span><small>{count}</small>
    </button>
  );
}

function NoteCard({ note, view, onEdit, onPin, onDelete }: {
  note: Note;
  view: ViewMode;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const mood = moodDetails[note.mood];
  return (
    <article className={`note-card color-${note.color} ${view === "timeline" ? "timeline-card" : ""}`}>
      <div className="note-topline">
        <Badge className={`mood-badge ${note.mood}`}>{mood.emoji} {mood.label}</Badge>
        <div className="note-actions">
          {note.pinned && <Pin className="pinned-mark" aria-label="Pinned note" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${note.title}`}><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil /> Edit note</DropdownMenuItem>
              <DropdownMenuItem onClick={onPin}><Pin /> {note.pinned ? "Unpin" : "Pin to top"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="danger-item" onClick={onDelete}><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <button className="note-content" onClick={onEdit} aria-label={`Edit ${note.title}`}>
        <h3>{note.title}</h3><p>{note.body}</p>
      </button>
      <div className="note-footer">
        <div className="tag-list">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
      </div>
    </article>
  );
}

function NoteEditor({ open, editing, draft, onOpenChange, onDraftChange, onSubmit }: {
  open: boolean;
  editing: boolean;
  draft: typeof emptyDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: typeof emptyDraft) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="note-dialog sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Shape this memory" : "Capture a new memory"}</DialogTitle>
          <DialogDescription>Add the visual cues your future self will recognise.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="note-form">
          <label><span>Title</span><Input autoFocus value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="What do you want to remember?" maxLength={80} /></label>
          <label><span>Your thought</span><Textarea value={draft.body} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="Write freely…" rows={7} maxLength={1200} /></label>

          <fieldset>
            <legend>How does it feel?</legend>
            <div className="mood-picker">
              {(Object.keys(moodDetails) as Mood[]).map((mood) => (
                <button type="button" key={mood} className={`${draft.mood === mood ? "selected" : ""} ${mood}`} onClick={() => onDraftChange({ ...draft, mood })} aria-pressed={draft.mood === mood}>
                  <span>{moodDetails[mood].emoji}</span>{moodDetails[mood].label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Memory colour</legend>
            <div className="color-picker">
              {noteColors.map((color) => (
                <button type="button" key={color.value} className={`color-${color.value} ${draft.color === color.value ? "selected" : ""}`} onClick={() => onDraftChange({ ...draft, color: color.value })} aria-label={color.label} aria-pressed={draft.color === color.value}>
                  {draft.color === color.value && <Check />}
                </button>
              ))}
            </div>
          </fieldset>

          <label><span>Tags <small>separate with commas</small></span><Input value={draft.tags} onChange={(event) => onDraftChange({ ...draft, tags: event.target.value })} placeholder="idea, personal, remember" /></label>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="save-button"><Sparkles /> {editing ? "Save changes" : "Keep this thought"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
