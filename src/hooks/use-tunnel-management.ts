import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TunnelConfig {
  id: string;
  url: string;
  is_active: boolean;
  last_health_check: string;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  created_at: string;
}

export function useTunnelManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current tunnel configuration
  const { data: tunnels, isLoading } = useQuery({
    queryKey: ['tunnel-configs'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('tunnel_configs' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as TunnelConfig[];
    },
  });

  // Add new tunnel URL
  const addTunnelMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await (supabase
        .from('tunnel_configs' as any)
        .insert({
          url,
          is_active: false,
          health_status: 'healthy',
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tunnel-configs'] });
      toast({
        title: 'Tunnel URL Added',
        description: 'New tunnel URL has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Tunnel',
        description: error.message || 'An error occurred while adding the tunnel URL.',
        variant: 'destructive',
      });
    },
  });

  // Switch active tunnel
  const switchTunnelMutation = useMutation({
    mutationFn: async (tunnelId: string) => {
      // First, deactivate all tunnels
      await (supabase
        .from('tunnel_configs' as any) as any)
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error } = await (supabase
        .from('tunnel_configs' as any) as any)
        .update({ is_active: true })
        .eq('id', tunnelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tunnel-configs'] });
      toast({
        title: 'Tunnel Switched',
        description: 'Successfully switched to the new tunnel URL.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Switch Tunnel',
        description: error.message || 'An error occurred while switching tunnel URLs.',
        variant: 'destructive',
      });
    },
  });

  // Update tunnel health status
  const updateHealthMutation = useMutation({
    mutationFn: async ({ tunnelId, status }: { tunnelId: string; status: string }) => {
      const { error } = await (supabase
        .from('tunnel_configs' as any) as any)
        .update({
          health_status: status,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', tunnelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tunnel-configs'] });
    },
  });

  const activeTunnel = tunnels?.find(tunnel => tunnel.is_active);

  return {
    tunnels,
    activeTunnel,
    isLoading,
    addTunnel: addTunnelMutation.mutate,
    switchTunnel: switchTunnelMutation.mutate,
    updateHealth: updateHealthMutation.mutate,
    isAddingTunnel: addTunnelMutation.isPending,
    isSwitchingTunnel: switchTunnelMutation.isPending,
  };
}