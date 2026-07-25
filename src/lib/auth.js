import { supabase } from './supabase'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email, password, nombre) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

export async function approveUser(profileId) {
  const { error } = await supabase
    .from('profiles')
    .update({ estado: 'activo' })
    .eq('id', profileId)
  if (error) throw error
}

export async function rejectUser(profileId) {
  const { error } = await supabase
    .from('profiles')
    .update({ estado: 'rechazado' })
    .eq('id', profileId)
  if (error) throw error
}

export async function fetchPendingProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
