import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  BudgetView,
  type BudgetViewHandle,
} from '@/features/budget/components/BudgetView';
import {
  DashboardInfographic,
  type DashboardMode,
} from '@/features/dashboard-infographic';
import { IncomeView, type IncomeViewHandle } from '@/features/income';
import { SpendingView, type SpendingViewHandle } from '@/features/spending';
import { Button } from '@/shared/components/Button';
import { PlanningFiltersBar } from '@/shared/components/PlanningFiltersBar';
import { TopNav, type TabType } from '@/shared/components/TopNav';
import { useSharedPlanningFilters } from '@/shared/hooks/useSharedPlanningFilters';
import { setNumberParam, setStringParam } from '@/shared/utils/searchParams';

import { MainContent } from './components/MainContent';

function buildSharedPlanningSearch(params: {
  planningYear: number;
  spendBasis: string;
}): string {
  const nextSearchParams = new URLSearchParams();
  setNumberParam(nextSearchParams, 'planningYear', params.planningYear);
  setStringParam(nextSearchParams, 'spendBasis', params.spendBasis);

  const nextSearch = nextSearchParams.toString();
  return nextSearch.length > 0 ? `?${nextSearch}` : '';
}

const PlanningShellPage: React.FC = () => {
  const budgetViewRef = useRef<BudgetViewHandle>(null);
  const spendingViewRef = useRef<SpendingViewHandle>(null);
  const incomeViewRef = useRef<IncomeViewHandle>(null);
  const currentYear = new Date().getFullYear();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('report');

  const activeTab = useMemo<TabType>(() => {
    switch (location.pathname) {
      case '/income':
        return 'income';
      case '/spending':
        return 'spending';
      case '/budget':
        return 'budget';
      case '/dashboard':
      default:
        return 'dashboard';
    }
  }, [location.pathname]);

  const {
    availableYears,
    planningYear,
    spendBasis,
    setPlanningYear,
    setPlanningFilters,
    setSpendBasis,
  } = useSharedPlanningFilters({
    searchParams,
    setSearchParams,
    fallbackYear: currentYear,
    enableLegacyPlanningYearFallback: activeTab !== 'spending',
    enableLegacySpendBasisFallback:
      activeTab === 'dashboard' || activeTab === 'budget',
  });

  const pageTitle = useMemo(() => {
    switch (activeTab) {
      case 'income':
        return 'Income';
      case 'spending':
        return 'Spending';
      case 'budget':
        return 'Budget';
      case 'dashboard':
      default:
        return 'Dashboard';
    }
  }, [activeTab]);

  const headerControls =
    activeTab === 'spending' ? null : (
      <PlanningFiltersBar
        planningYear={planningYear}
        availableYears={availableYears}
        onPlanningYearChange={setPlanningYear}
        spendBasis={spendBasis}
        onSpendBasisChange={setSpendBasis}
        onPlanningFiltersChange={setPlanningFilters}
        showPlanningYear={true}
        showSpendBasis={true}
      />
    );

  const headerAction = (() => {
    switch (activeTab) {
      case 'budget':
        return (
          <Button
            onClick={() => budgetViewRef.current?.openAddBudgetModal()}
            variant="primary"
          >
            + Add Budget Item
          </Button>
        );
      case 'spending':
        return (
          <Button
            onClick={() => spendingViewRef.current?.openAddTransactionModal()}
            variant="primary"
          >
            + Add Transaction
          </Button>
        );
      case 'income':
        return (
          <Button
            onClick={() => incomeViewRef.current?.openAddIncomeModal()}
            variant="primary"
          >
            + Add Income
          </Button>
        );
      default:
        return undefined;
    }
  })();

  const content = (() => {
    switch (activeTab) {
      case 'income':
        return <IncomeView ref={incomeViewRef} planningYear={planningYear} />;
      case 'spending':
        return <SpendingView ref={spendingViewRef} />;
      case 'budget':
        return (
          <BudgetView
            ref={budgetViewRef}
            planningYear={planningYear}
            spendBasis={spendBasis}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardInfographic
            year={planningYear}
            availableYears={availableYears}
            spendBasis={spendBasis}
            mode={dashboardMode}
            onModeChange={setDashboardMode}
          />
        );
    }
  })();

  return (
    <div className="min-h-screen">
      <TopNav
        activeTab={activeTab}
        rightContent={headerControls}
        showThemeToggle={false}
        onTabChange={(tab) => {
          if (tab !== activeTab) {
            navigate({
              pathname: `/${tab}`,
              search: buildSharedPlanningSearch({
                planningYear,
                spendBasis,
              }),
            });
          }
        }}
      />
      <MainContent title={pageTitle} headerAction={headerAction}>
        {content}
      </MainContent>
    </div>
  );
};

export default PlanningShellPage;
