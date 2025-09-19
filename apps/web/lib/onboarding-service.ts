/**
 * Organization Onboarding Service
 * FRIAXIS v4.0.0 - Sistema de Onboarding Multi-tenant
 * 
 * Este serviço gerencia:
 * - Criação de novas organizações
 * - Setup inicial de usuário administrador
 * - Configuração de planos e limites
 * - Geração de dados iniciais
 */

import { Organization, User, OrganizationMember, Subscription } from '../../../packages/shared/types';

// ================================
// Onboarding Types
// ================================

export interface OnboardingData {
  // Dados da organização
  organization: {
    name: string;
    display_name: string;
    contact_email: string;
    phone?: string;
    website?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    };
  };
  
  // Dados do usuário administrador
  admin_user: {
    email: string;
    display_name: string;
    firebase_uid: string;
  };
  
  // Plano inicial
  plan: {
    type: 'trial' | 'starter' | 'professional' | 'enterprise';
    billing_cycle?: 'monthly' | 'yearly';
  };
  
  // Configurações iniciais
  settings?: {
    timezone?: string;
    language?: string;
    features?: string[];
  };
}

export interface OnboardingResult {
  success: boolean;
  organization?: Organization;
  user?: User;
  member?: OrganizationMember;
  subscription?: Subscription;
  setup_steps?: OnboardingStep[];
  error?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  completed_at?: string;
}

// ================================
// Plan Configuration
// ================================

const PLAN_CONFIGURATIONS = {
  trial: {
    limits: {
      devices: 5,
      users: 2,
      storage_gb: 1,
      api_calls_month: 1000,
    },
    features: [
      'device_management',
      'basic_policies',
      'location_tracking',
      'basic_analytics'
    ],
    trial_duration_days: 14,
  },
  starter: {
    limits: {
      devices: 25,
      users: 5,
      storage_gb: 5,
      api_calls_month: 5000,
    },
    features: [
      'device_management',
      'policy_enforcement',
      'location_tracking',
      'alerts',
      'basic_analytics',
      'email_notifications'
    ],
  },
  professional: {
    limits: {
      devices: 100,
      users: 15,
      storage_gb: 25,
      api_calls_month: 15000,
    },
    features: [
      'device_management',
      'advanced_policies',
      'location_tracking',
      'geofencing',
      'alerts',
      'advanced_analytics',
      'email_notifications',
      'webhook_notifications',
      'api_access',
      'custom_reports'
    ],
  },
  enterprise: {
    limits: {
      devices: 1000,
      users: 50,
      storage_gb: 100,
      api_calls_month: 50000,
    },
    features: [
      'device_management',
      'enterprise_policies',
      'location_tracking',
      'geofencing',
      'alerts',
      'enterprise_analytics',
      'all_notifications',
      'api_access',
      'custom_reports',
      'sso_integration',
      'audit_logs',
      'priority_support'
    ],
  },
};

// ================================
// Onboarding Service
// ================================

export class OrganizationOnboardingService {
  
  /**
   * Cria uma nova organização com setup completo
   */
  async createOrganization(data: OnboardingData): Promise<OnboardingResult> {
    const steps: OnboardingStep[] = [
      { id: 'validate_data', title: 'Validar dados', description: 'Validando informações fornecidas', status: 'pending' },
      { id: 'create_org', title: 'Criar organização', description: 'Criando registro da organização', status: 'pending' },
      { id: 'create_user', title: 'Configurar usuário', description: 'Criando usuário administrador', status: 'pending' },
      { id: 'setup_membership', title: 'Configurar acesso', description: 'Configurando permissões de acesso', status: 'pending' },
      { id: 'setup_subscription', title: 'Configurar plano', description: 'Configurando plano e limites', status: 'pending' },
      { id: 'initial_setup', title: 'Setup inicial', description: 'Configurando dados iniciais', status: 'pending' },
    ];

    try {
      // Step 1: Validate data
      steps[0].status = 'in_progress';
      await this.validateOnboardingData(data);
      steps[0].status = 'completed';
      steps[0].completed_at = new Date().toISOString();

      // Step 2: Create organization
      steps[1].status = 'in_progress';
      const organization = await this.createOrganizationRecord(data);
      steps[1].status = 'completed';
      steps[1].completed_at = new Date().toISOString();

      // Step 3: Create/update user
      steps[2].status = 'in_progress';
      const user = await this.createOrUpdateUser(data.admin_user);
      steps[2].status = 'completed';
      steps[2].completed_at = new Date().toISOString();

      // Step 4: Setup membership
      steps[3].status = 'in_progress';
      const member = await this.createOrganizationMembership(organization.id, user.id);
      steps[3].status = 'completed';
      steps[3].completed_at = new Date().toISOString();

      // Step 5: Setup subscription
      steps[4].status = 'in_progress';
      const subscription = await this.createSubscription(organization.id, data.plan);
      steps[4].status = 'completed';
      steps[4].completed_at = new Date().toISOString();

      // Step 6: Initial setup
      steps[5].status = 'in_progress';
      await this.performInitialSetup(organization.id, data.settings);
      steps[5].status = 'completed';
      steps[5].completed_at = new Date().toISOString();

      return {
        success: true,
        organization,
        user,
        member,
        subscription,
        setup_steps: steps,
      };

    } catch (error) {
      console.error('Onboarding failed:', error);
      
      // Mark current step as failed
      const currentStep = steps.find(s => s.status === 'in_progress');
      if (currentStep) {
        currentStep.status = 'failed';
        currentStep.error_message = error instanceof Error ? error.message : 'Unknown error';
      }

      return {
        success: false,
        setup_steps: steps,
        error: error instanceof Error ? error.message : 'Onboarding failed',
      };
    }
  }

  /**
   * Valida dados de entrada do onboarding
   */
  private async validateOnboardingData(data: OnboardingData): Promise<void> {
    // Validar dados obrigatórios
    if (!data.organization.name || data.organization.name.trim().length === 0) {
      throw new Error('Nome da organização é obrigatório');
    }

    if (!data.organization.contact_email || !this.isValidEmail(data.organization.contact_email)) {
      throw new Error('Email de contato válido é obrigatório');
    }

    if (!data.admin_user.email || !this.isValidEmail(data.admin_user.email)) {
      throw new Error('Email do administrador válido é obrigatório');
    }

    if (!data.admin_user.firebase_uid) {
      throw new Error('Firebase UID é obrigatório');
    }

    // Verificar se organização já existe
    const existingOrg = await this.checkOrganizationExists(data.organization.name);
    if (existingOrg) {
      throw new Error('Já existe uma organização com este nome');
    }

    // Verificar se usuário já está em outra organização
    const existingMembership = await this.checkUserExistingMembership(data.admin_user.firebase_uid);
    if (existingMembership) {
      throw new Error('Usuário já possui acesso a outra organização');
    }
  }

  /**
   * Cria registro da organização
   */
  private async createOrganizationRecord(data: OnboardingData): Promise<Organization> {
    const slug = this.generateSlug(data.organization.name);
    const planConfig = PLAN_CONFIGURATIONS[data.plan.type];

    const organization: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.organization.name,
      slug,
      display_name: data.organization.display_name || data.organization.name,
      description: `Organização criada em ${new Date().toLocaleDateString('pt-BR')}`,
      contact_email: data.organization.contact_email,
      phone: data.organization.phone,
      website: data.organization.website,
      address: data.organization.address,
      settings: {
        max_devices: planConfig.limits.devices,
        max_users: planConfig.limits.users,
        features: planConfig.features,
        timezone: data.settings?.timezone || 'America/Sao_Paulo',
        language: data.settings?.language || 'pt-BR',
        notifications: {
          email: true,
          sms: false,
          webhook: false,
        },
      },
      plan_type: data.plan.type,
      plan_limits: planConfig.limits,
      status: 'active',
      trial_ends_at: data.plan.type === 'trial' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
        : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Insert into database
    console.log('Creating organization:', organization);
    
    return organization;
  }

  /**
   * Cria ou atualiza usuário
   */
  private async createOrUpdateUser(userData: OnboardingData['admin_user']): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firebase_uid: userData.firebase_uid,
      email: userData.email,
      email_verified: false, // Will be verified through Firebase
      display_name: userData.display_name,
      preferences: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        dashboard: {
          default_view: 'dashboard',
          widgets: ['device_status', 'recent_alerts', 'compliance_overview'],
        },
      },
      login_count: 0,
      two_factor_enabled: false,
      is_active: true,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Insert or update in database
    console.log('Creating user:', user);
    
    return user;
  }

  /**
   * Cria membership do usuário na organização
   */
  private async createOrganizationMembership(organizationId: string, userId: string): Promise<OrganizationMember> {
    const member: OrganizationMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization_id: organizationId,
      user_id: userId,
      role: 'owner', // First user is always owner
      permissions: {
        devices: { read: true, write: true, delete: true },
        policies: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true },
        analytics: { read: true },
        settings: { read: true, write: true },
      },
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Insert into database
    console.log('Creating membership:', member);
    
    return member;
  }

  /**
   * Cria subscription da organização
   */
  private async createSubscription(organizationId: string, planData: OnboardingData['plan']): Promise<Subscription> {
    const now = new Date();
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization_id: organizationId,
      status: planData.type === 'trial' ? 'active' : 'active',
      plan_type: planData.type,
      amount_cents: this.getPlanPrice(planData.type, planData.billing_cycle),
      currency: 'BRL',
      billing_cycle: planData.billing_cycle || 'monthly',
      current_period_start: now.toISOString(),
      current_period_end: this.calculatePeriodEnd(now, planData.billing_cycle || 'monthly').toISOString(),
      trial_end: planData.type === 'trial' 
        ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      metadata: {
        created_via: 'onboarding',
        initial_plan: planData.type,
      },
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // TODO: Insert into database and setup external subscription if needed
    console.log('Creating subscription:', subscription);
    
    return subscription;
  }

  /**
   * Realiza setup inicial da organização
   */
  private async performInitialSetup(organizationId: string, settings?: OnboardingData['settings']): Promise<void> {
    // Create default policies
    await this.createDefaultPolicies(organizationId);
    
    // Create initial analytics entries
    await this.setupInitialAnalytics(organizationId);
    
    // Create welcome notification
    await this.createWelcomeNotification(organizationId);
    
    console.log('Initial setup completed for organization:', organizationId);
  }

  // ================================
  // Helper Methods
  // ================================

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Math.random().toString(36).substr(2, 6);
  }

  private async checkOrganizationExists(name: string): Promise<boolean> {
    // TODO: Check database for existing organization
    return false;
  }

  private async checkUserExistingMembership(firebaseUid: string): Promise<boolean> {
    // TODO: Check if user already has active membership
    return false;
  }

  private getPlanPrice(planType: string, billingCycle?: string): number {
    const prices = {
      trial: 0,
      starter: billingCycle === 'yearly' ? 19900 : 1990, // R$ 199/year or R$ 19.90/month
      professional: billingCycle === 'yearly' ? 49900 : 4990, // R$ 499/year or R$ 49.90/month
      enterprise: billingCycle === 'yearly' ? 99900 : 9990, // R$ 999/year or R$ 99.90/month
    };
    
    return prices[planType as keyof typeof prices] || 0;
  }

  private calculatePeriodEnd(start: Date, billingCycle: string): Date {
    const end = new Date(start);
    
    if (billingCycle === 'yearly') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    
    return end;
  }

  private async createDefaultPolicies(organizationId: string): Promise<void> {
    // TODO: Create default security policies
    console.log('Creating default policies for organization:', organizationId);
  }

  private async setupInitialAnalytics(organizationId: string): Promise<void> {
    // TODO: Setup initial analytics metrics
    console.log('Setting up analytics for organization:', organizationId);
  }

  private async createWelcomeNotification(organizationId: string): Promise<void> {
    // TODO: Create welcome notification
    console.log('Creating welcome notification for organization:', organizationId);
  }
}

// ================================
// Export Service Instance
// ================================

export const onboardingService = new OrganizationOnboardingService();