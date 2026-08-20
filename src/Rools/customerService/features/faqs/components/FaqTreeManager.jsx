import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Headphones,
  MessageSquareText,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import Modal from "@/shared/components/Modal";
import {
  createFaqRequest,
  deleteFaqRequest,
  getFaqTreeRequest,
  updateFaqRequest,
} from "../api/faq.api";

const EMPTY_FORM = {
  parent_id: "",
  type: "category",
  title: "",
  content: "",
  sort_order: "",
};

const extractTree = (result) => {
  const payload = result?.data?.data ?? result?.data ?? [];
  return Array.isArray(payload) ? payload : payload?.data || [];
};

const flattenTree = (nodes = [], depth = 0) =>
  nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children || [], depth + 1),
  ]);

const typeMeta = {
  category: { label: "Category", icon: CircleHelp },
  answer: { label: "Answer", icon: MessageSquareText },
  action_human: { label: "Human support", icon: Headphones },
};

function FaqNode({ node, depth, expanded, selectedId, onToggle, onSelect, onAdd, onEdit, onDelete }) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(String(node.id));
  const Icon = typeMeta[node.type]?.icon || Bot;

  if (node.type === "category") {
    return (
      <section className="faq-category-card" style={{ "--faq-depth": depth }}>
        <div className="faq-category-head">
          <button type="button" className="faq-category-main" onClick={() => onToggle(node.id)}>
            <Icon size={16} /><strong>{node.title}</strong>
            <span className="faq-category-count">{node.children?.length || 0}</span>
            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          <div className="faq-node-actions">
            <button type="button" onClick={() => onAdd(node)} title="Add question"><Plus size={14} /></button>
            <button type="button" onClick={() => onEdit(node)} title="Edit category"><PencilLine size={14} /></button>
            <button type="button" className="danger" onClick={() => onDelete(node)} title="Delete category"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded ? <div className="faq-category-questions">
          {hasChildren ? node.children.map((child) => <FaqNode key={child.id} node={child} depth={depth + 1} expanded={expanded} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />) : <p>No questions in this category yet.</p>}
        </div> : null}
      </section>
    );
  }

  return (
    <article className={`faq-question-row type-${node.type} ${String(selectedId) === String(node.id) ? "selected" : ""}`}>
      <button type="button" className="faq-question-main" onClick={() => onSelect(node)}>
        <Icon size={14} />
        <span><strong>{node.title}</strong>{node.content && String(selectedId) === String(node.id) ? <small>{node.content}</small> : null}</span>
        <ChevronRight size={15} />
      </button>
      <div className="faq-node-actions">
        <button type="button" onClick={() => onEdit(node)} title="Edit"><PencilLine size={14} /></button>
        <button type="button" className="danger" onClick={() => onDelete(node)} title="Delete"><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

FaqNode.propTypes = {
  node: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  expanded: PropTypes.instanceOf(Set).isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggle: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

FaqNode.defaultProps = { selectedId: null };

export default function FaqTreeManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const parentOptions = useMemo(
    () => flattenTree(tree).filter((node) => node.type === "category" && node.id !== editing?.id),
    [editing?.id, tree]
  );

  const visibleTree = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tree;

    const filterNodes = (nodes) => nodes.reduce((result, node) => {
      const children = filterNodes(node.children || []);
      const matches = [node.title, node.content, node.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
      if (matches || children.length) result.push({ ...node, children });
      return result;
    }, []);

    return filterNodes(tree);
  }, [search, tree]);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getFaqTreeRequest();
    if (result.ok) {
      const items = extractTree(result);
      setTree(items);
      setExpanded(new Set(items.map((item) => String(item.id))));
    } else {
      setError(result.message || "Failed to load FAQ tree.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  const openCreate = (parent = null) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parent_id: parent?.id ? String(parent.id) : "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (node) => {
    setEditing(node);
    setForm({
      parent_id: node.parent_id == null ? "" : String(node.parent_id),
      type: node.type || "category",
      title: node.title || "",
      content: node.content || "",
      sort_order: node.sort_order ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (form.type === "answer" && !form.content.trim()) return setError("Answer content is required.");

    setSaving(true);
    setError("");
    const payload = {
      ...form,
      parent_id: form.parent_id || null,
      content: form.type === "answer" ? form.content.trim() : null,
      title: form.title.trim(),
    };
    const result = editing
      ? await updateFaqRequest(editing.id, payload)
      : await createFaqRequest(payload);
    setSaving(false);

    if (!result.ok) return setError(result.message || "Could not save FAQ item.");
    setModalOpen(false);
    await loadTree();
  };

  const remove = async (node) => {
    if (!window.confirm(`Delete “${node.title}” and its related branch?`)) return;
    const result = await deleteFaqRequest(node.id);
    if (!result.ok) return setError(result.message || "Could not delete FAQ item.");
    await loadTree();
  };

  const toggle = (id) => setExpanded((current) => {
    const next = new Set(current);
    const key = String(id);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <>
      <div className="faq-tree-intro">
        <div className="faq-intro-copy">
          <span className="faq-intro-icon"><MessageSquareText size={22} /></span>
          <div><strong>Frequently asked questions</strong><small>Find a ready answer while chatting with the customer.</small></div>
        </div>
        <label className="faq-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions and answers..." /></label>
      </div>
      <div className="faq-tree-toolbar">
        <div><strong>Knowledge base</strong><small>{flattenTree(tree).length} items in {tree.length} categories</small></div>
        <button type="button" onClick={loadTree} title="Refresh"><RefreshCw size={15} /></button>
      </div>
      <div className="faq-tree-scroll">
        {loading ? <div className="table-state">Loading FAQ tree...</div> : null}
        {!loading && error ? <div className="faq-tree-error">{error}</div> : null}
        {!loading && tree.length === 0 ? <p className="customer-service-empty-note">No FAQ items yet.</p> : null}
        {!loading && visibleTree.length === 0 ? <p className="customer-service-empty-note">No questions match your search.</p> : null}
        {!loading ? visibleTree.map((node) => (
          <FaqNode key={node.id} node={node} depth={0} expanded={expanded} selectedId={selectedId} onToggle={toggle} onSelect={(item) => setSelectedId((current) => String(current) === String(item.id) ? null : item.id)} onAdd={openCreate} onEdit={openEdit} onDelete={remove} />
        )) : null}
      </div>
      <div className="faq-tree-footer"><button type="button" onClick={() => openCreate()}><Plus size={15} /> New root in FAQ</button></div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit FAQ item" : "Add FAQ item"}
        description="Build the guided support path shown to clients."
        size="md"
      >
        <form className="faq-editor-form" onSubmit={submit}>
          <label><span>Parent level</span><select value={form.parent_id} onChange={(e) => setForm((v) => ({ ...v, parent_id: e.target.value }))}><option value="">Root level</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{"— ".repeat(item.depth)}{item.title}</option>)}</select></label>
          <label><span>Item type</span><select value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value, content: e.target.value === "answer" ? v.content : "" }))}><option value="category">Category / branch</option><option value="answer">Final answer</option><option value="action_human">Transfer to human</option></select></label>
          <label className="wide"><span>Title or question</span><input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Example: Payment methods" /></label>
          {form.type === "answer" ? <label className="wide"><span>Answer content</span><textarea rows="4" value={form.content} onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))} placeholder="Write the final answer shown to the client..." /></label> : null}
          <label><span>Sort order</span><input type="number" min="0" value={form.sort_order} onChange={(e) => setForm((v) => ({ ...v, sort_order: e.target.value }))} placeholder="Optional" /></label>
          {error ? <p className="faq-tree-error wide">{error}</p> : null}
          <div className="modal-actions wide"><button type="button" className="ghost-filter-btn" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-action-btn" disabled={saving}>{saving ? "Saving..." : "Save item"}</button></div>
        </form>
      </Modal>
    </>
  );
}
