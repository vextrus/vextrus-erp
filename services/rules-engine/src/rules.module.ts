import { Module } from '@nestjs/common';
import { RulesController } from './controllers/rules.controller';
import { RuleSetController } from './controllers/rule-set.controller';
import { EvaluationController } from './controllers/evaluation.controller';
import { TaxRulesController } from './controllers/tax-rules.controller';
import { RulesService } from './services/rules.service';
import { RuleSetService } from './services/rule-set.service';
import { EvaluationService } from './services/evaluation.service';
import { TaxRulesService } from './services/tax-rules.service';
import { EngineService } from './services/engine.service';
import { CacheService } from './services/cache.service';
import { RuleResolver } from './graphql/rule.resolver';

@Module({
  controllers: [
    RulesController,
    RuleSetController,
    EvaluationController,
    TaxRulesController,
  ],
  providers: [
    RulesService,
    RuleSetService,
    EvaluationService,
    TaxRulesService,
    EngineService,
    CacheService,
    // GraphQL Resolvers
    RuleResolver,
  ],
  exports: [
    RulesService,
    RuleSetService,
    EvaluationService,
    TaxRulesService,
  ],
})
export class RulesModule {}