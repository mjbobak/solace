import React, { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  BudgetView,
  type BudgetViewHandle,
} from '@/features/budget/components/BudgetView';
import { DashboardInfographic } from '@/features/dashboard-infographic';
import { IncomeView, type IncomeViewHandle } from '@/features/income';
import { SpendingView, type SpendingViewHandle } from '@/features/spending';
import { Button } from '@/shared/components/Button';

import { TopNav } from '../../shared/components/TopNav';
import type { TabType } from '../../shared/components/TopNav';

import { MainContent } from './components/MainContent';

const HomePage: React.FC = () => {
  const budgetViewRef = useRef<BudgetViewHandle>(null);
  const spendingViewRef = useRef<SpendingViewHandle>(null);
  const incomeViewRef = useRef<IncomeViewHandle>(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  const getPageTitle = (): string => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'income':
        return 'Income';
      case 'spending':
        return 'Spending';
      case 'budget':
        return 'Budget';
      default:
        return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardInfographic />;
      case 'income':
        return <IncomeView ref={incomeViewRef} />;
      case 'spending':
        return <SpendingView ref={spendingViewRef} />;
      case 'budget':
        return <BudgetView ref={budgetViewRef} />;
      default:
        return <DashboardInfographic />;
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== activeTab) {
            navigate(`/${tab}`);
          }
        }}
      />
      <MainContent
        title={getPageTitle()}
        headerAction={(() => {
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
                  onClick={() =>
                    spendingViewRef.current?.openAddTransactionModal()
                  }
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
        })()}
      >
        {renderContent()}
      </MainContent>
    </div>
  );
};

export default HomePage;
