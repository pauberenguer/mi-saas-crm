"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import { Plus, Trash2, Edit3, MessageSquare } from "lucide-react";

interface QuickReply {
  id: number;
  content: string;
  created_at: string;
  created_by: string;
}

export default function RespuestasRapidasPage() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReplyContent, setNewReplyContent] = useState("");
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<QuickReply | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // Cargar usuario actual
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", data.user.id)
          .single();
        if (profile) setCurrentUser(profile);
      }
    }
    fetchUser();
  }, []);

  // Cargar respuestas rápidas
  useEffect(() => {
    fetchQuickReplies();
  }, []);

  const fetchQuickReplies = async () => {
    const { data, error } = await supabase
      .from("respuestas_rapidas")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setQuickReplies(data);
    }
  };

  const addQuickReply = async () => {
    if (!newReplyContent.trim() || !currentUser) return;

    const { error } = await supabase
      .from("respuestas_rapidas")
      .insert([
        {
          content: newReplyContent.trim(),
          created_by: currentUser.id,
        },
      ]);

    if (!error) {
      setNewReplyContent("");
      setShowAddForm(false);
      fetchQuickReplies();
    }
  };

  const updateQuickReply = async () => {
    if (!editContent.trim() || !editingReply) return;

    const { error } = await supabase
      .from("respuestas_rapidas")
      .update({ content: editContent.trim() })
      .eq("id", editingReply.id);

    if (!error) {
      setEditingReply(null);
      setEditContent("");
      fetchQuickReplies();
    }
  };

  const deleteQuickReply = async (reply: QuickReply) => {
    const { error } = await supabase
      .from("respuestas_rapidas")
      .delete()
      .eq("id", reply.id);

    if (!error) {
      setShowDeleteConfirm(null);
      fetchQuickReplies();
    }
  };

  const startEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setEditContent(reply.content);
  };

  const cancelEdit = () => {
    setEditingReply(null);
    setEditContent("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Respuestas Rápidas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona tus respuestas predefinidas para agilizar la atención al cliente.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Respuesta
        </button>
      </div>

      {/* Formulario de agregar */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nueva Respuesta Rápida</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido de la respuesta
              </label>
              <textarea
                value={newReplyContent}
                onChange={(e) => setNewReplyContent(e.target.value)}
                placeholder="Escribe tu respuesta rápida aquí..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={addQuickReply}
                disabled={!newReplyContent.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewReplyContent("");
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de respuestas rápidas */}
      <div className="space-y-4">
        {quickReplies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay respuestas rápidas
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primera respuesta rápida para agilizar tus conversaciones.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear Primera Respuesta
            </button>
          </div>
        ) : (
          quickReplies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {editingReply?.id === reply.id ? (
                // Modo edición
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={updateQuickReply}
                      disabled={!editContent.trim()}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2">{reply.content}</p>
                    <p className="text-xs text-gray-500">
                      Creado el {new Date(reply.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(reply)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(reply)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Eliminar Respuesta Rápida
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                ¿Estás seguro de que quieres eliminar esta respuesta rápida? Esta acción no se puede deshacer.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700 italic">"{showDeleteConfirm.content}"</p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteQuickReply(showDeleteConfirm)}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 