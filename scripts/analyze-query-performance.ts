/**
 * Script d'analyse des performances des requêtes PostgreSQL
 * Analyse les données de pg_stat_statements et génère un rapport d'optimisation
 */

interface QueryStats {
  query: string;
  rolname: string;
  calls: number;
  mean_time: number;
  min_time: number;
  max_time: number;
  total_time: number;
  rows_read: number;
  cache_hit_rate: string;
  prop_total_time: number;
  index_advisor_result: string | null;
}

interface AnalysisResult {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  query: string;
  issue: string;
  recommendation: string;
  metrics: {
    calls?: number;
    mean_time?: number;
    min_time?: number;
    max_time?: number;
    total_time?: number;
    cache_hit_rate?: number;
    prop_total_time?: number;
    rows_read?: number;
  };
}

function parseCacheHitRate(rate: string): number {
  return parseFloat(rate) || 0;
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function truncateQuery(query: string, maxLength: number = 100): string {
  if (query.length <= maxLength) return query;
  return query.substring(0, maxLength) + '...';
}

function analyzeQuery(stats: QueryStats): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  const cacheHitRate = parseCacheHitRate(stats.cache_hit_rate);
  const queryPreview = truncateQuery(stats.query, 150);

  // 1. Requêtes très lentes (mean_time > 100ms)
  if (stats.mean_time > 100) {
    results.push({
      severity: stats.mean_time > 500 ? 'critical' : 'high',
      query: queryPreview,
      issue: `Temps d'exécution moyen élevé: ${formatTime(stats.mean_time)}`,
      recommendation: stats.mean_time > 500
        ? 'Optimiser la requête (indexes manquants, jointures coûteuses, scans complets)'
        : 'Vérifier les indexes et considérer la mise en cache',
      metrics: {
        mean_time: stats.mean_time,
        total_time: stats.total_time,
        calls: stats.calls,
      },
    });
  }

  // 2. Cache hit rate faible (< 95%)
  if (cacheHitRate < 95 && stats.calls > 10) {
    results.push({
      severity: cacheHitRate < 80 ? 'high' : 'medium',
      query: queryPreview,
      issue: `Taux de cache faible: ${cacheHitRate.toFixed(2)}%`,
      recommendation: 'Augmenter shared_buffers ou optimiser les patterns de requêtes',
      metrics: {
        cache_hit_rate: cacheHitRate,
        calls: stats.calls,
      },
    });
  }

  // 3. Nombre élevé d'appels avec temps total important
  if (stats.calls > 100 && stats.total_time > 1000) {
    results.push({
      severity: stats.calls > 1000 ? 'high' : 'medium',
      query: queryPreview,
      issue: `Nombre élevé d'appels: ${stats.calls} appels, ${formatTime(stats.total_time)} total`,
      recommendation: 'Mettre en cache les résultats ou optimiser la requête',
      metrics: {
        calls: stats.calls,
        total_time: stats.total_time,
        mean_time: stats.mean_time,
      },
    });
  }

  // 4. Proportion importante du temps total (> 10%)
  if (stats.prop_total_time > 10) {
    results.push({
      severity: stats.prop_total_time > 30 ? 'critical' : 'high',
      query: queryPreview,
      issue: `Consomme ${stats.prop_total_time.toFixed(2)}% du temps total`,
      recommendation: 'Priorité d\'optimisation élevée - impact majeur sur les performances',
      metrics: {
        prop_total_time: stats.prop_total_time,
        total_time: stats.total_time,
        calls: stats.calls,
      },
    });
  }

  // 5. Variance importante (max_time >> mean_time)
  if (stats.max_time > stats.mean_time * 3 && stats.calls > 10) {
    results.push({
      severity: 'medium',
      query: queryPreview,
      issue: `Variance importante: min=${formatTime(stats.min_time)}, max=${formatTime(stats.max_time)}`,
      recommendation: 'Vérifier les paramètres de requête ou les conditions de concurrence',
      metrics: {
        mean_time: stats.mean_time,
        min_time: stats.min_time,
        max_time: stats.max_time,
      },
    });
  }

  // 6. Beaucoup de lignes lues avec peu de cache
  if (stats.rows_read > 10000 && cacheHitRate < 90) {
    results.push({
      severity: 'medium',
      query: queryPreview,
      issue: `Lecture de ${stats.rows_read.toLocaleString()} lignes avec cache faible`,
      recommendation: 'Ajouter des indexes ou optimiser les filtres WHERE',
      metrics: {
        rows_read: stats.rows_read,
        cache_hit_rate: cacheHitRate,
      },
    });
  }

  return results;
}

function generateReport(data: QueryStats[]): void {
  console.log('\n📊 RAPPORT D\'ANALYSE DES PERFORMANCES POSTGRESQL\n');
  console.log('='.repeat(80));

  // Statistiques globales
  const totalCalls = data.reduce((sum, q) => sum + q.calls, 0);
  const totalTime = data.reduce((sum, q) => sum + q.total_time, 0);
  const avgCacheHitRate =
    data.reduce((sum, q) => sum + parseCacheHitRate(q.cache_hit_rate), 0) / data.length;

  console.log('\n📈 STATISTIQUES GLOBALES');
  console.log('-'.repeat(80));
  console.log(`Total de requêtes uniques: ${data.length}`);
  console.log(`Total d'appels: ${totalCalls.toLocaleString()}`);
  console.log(`Temps total: ${formatTime(totalTime)}`);
  console.log(`Taux de cache moyen: ${avgCacheHitRate.toFixed(2)}%`);

  // Analyse de chaque requête
  const allIssues: AnalysisResult[] = [];
  data.forEach((stats) => {
    const issues = analyzeQuery(stats);
    allIssues.push(...issues);
  });

  // Trier par sévérité
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Grouper par sévérité
  const bySeverity = {
    critical: allIssues.filter((i) => i.severity === 'critical'),
    high: allIssues.filter((i) => i.severity === 'high'),
    medium: allIssues.filter((i) => i.severity === 'medium'),
    low: allIssues.filter((i) => i.severity === 'low'),
    info: allIssues.filter((i) => i.severity === 'info'),
  };

  // Afficher les problèmes par sévérité
  console.log('\n🚨 PROBLÈMES IDENTIFIÉS');
  console.log('='.repeat(80));

  Object.entries(bySeverity).forEach(([severity, issues]) => {
    if (issues.length === 0) return;

    const emoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      info: 'ℹ️',
    }[severity];

    console.log(`\n${emoji} ${severity.toUpperCase()} (${issues.length})`);
    console.log('-'.repeat(80));

    issues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. ${issue.issue}`);
      console.log(`   Requête: ${issue.query}`);
      console.log(`   💡 ${issue.recommendation}`);
      if (issue.metrics) {
        const metricsStr = Object.entries(issue.metrics)
          .map(([key, value]) => {
            if (key === 'cache_hit_rate') return `${key}: ${value?.toFixed(2)}%`;
            if (key.includes('time')) return `${key}: ${formatTime(value as number)}`;
            return `${key}: ${value?.toLocaleString()}`;
          })
          .join(', ');
        console.log(`   📊 ${metricsStr}`);
      }
    });
  });

  // Top 10 des requêtes les plus coûteuses
  console.log('\n\n🏆 TOP 10 DES REQUÊTES LES PLUS COÛTEUSES (par temps total)');
  console.log('='.repeat(80));
  const topByTotalTime = [...data]
    .sort((a, b) => b.total_time - a.total_time)
    .slice(0, 10);

  topByTotalTime.forEach((stats, idx) => {
    console.log(`\n${idx + 1}. ${truncateQuery(stats.query, 120)}`);
    console.log(`   Rôle: ${stats.rolname}`);
    console.log(`   Appels: ${stats.calls.toLocaleString()}`);
    console.log(`   Temps moyen: ${formatTime(stats.mean_time)}`);
    console.log(`   Temps total: ${formatTime(stats.total_time)}`);
    console.log(`   % du temps total: ${stats.prop_total_time.toFixed(2)}%`);
    console.log(`   Cache hit rate: ${parseCacheHitRate(stats.cache_hit_rate).toFixed(2)}%`);
  });

  // Top 10 des requêtes les plus fréquentes
  console.log('\n\n📞 TOP 10 DES REQUÊTES LES PLUS FRÉQUENTES');
  console.log('='.repeat(80));
  const topByCalls = [...data]
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 10);

  topByCalls.forEach((stats, idx) => {
    console.log(`\n${idx + 1}. ${truncateQuery(stats.query, 120)}`);
    console.log(`   Rôle: ${stats.rolname}`);
    console.log(`   Appels: ${stats.calls.toLocaleString()}`);
    console.log(`   Temps moyen: ${formatTime(stats.mean_time)}`);
    console.log(`   Temps total: ${formatTime(stats.total_time)}`);
  });

  // Recommandations globales
  console.log('\n\n💡 RECOMMANDATIONS GLOBALES');
  console.log('='.repeat(80));

  const recommendations: string[] = [];

  if (avgCacheHitRate < 95) {
    recommendations.push(
      `Taux de cache global faible (${avgCacheHitRate.toFixed(2)}%). Vérifier shared_buffers et work_mem.`
    );
  }

  const slowQueries = data.filter((q) => q.mean_time > 100);
  if (slowQueries.length > 0) {
    recommendations.push(
      `${slowQueries.length} requête(s) lente(s) détectée(s). Prioriser leur optimisation.`
    );
  }

  const highPropQueries = data.filter((q) => q.prop_total_time > 10);
  if (highPropQueries.length > 0) {
    recommendations.push(
      `${highPropQueries.length} requête(s) consommant plus de 10% du temps total. Optimisation prioritaire.`
    );
  }

  if (recommendations.length === 0) {
    console.log('✅ Aucun problème majeur détecté. Les performances semblent bonnes.');
  } else {
    recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Point d'entrée
async function main() {
  const args = process.argv.slice(2);
  let inputFile: string | null = null;

  if (args.length > 0) {
    inputFile = args[0];
  }

  let data: QueryStats[];

  if (inputFile) {
    // Lire depuis un fichier
    const fs = await import('fs/promises');
    const content = await fs.readFile(inputFile, 'utf-8');
    data = JSON.parse(content);
  } else {
    // Lire depuis stdin
    console.log('📥 Lecture des données depuis stdin...');
    console.log('💡 Astuce: Utilisez "tsx scripts/analyze-query-performance.ts data.json" pour un fichier');
    let input = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      input += chunk;
    }
    data = JSON.parse(input);
  }

  if (!Array.isArray(data)) {
    console.error('❌ Erreur: Les données doivent être un tableau JSON');
    process.exit(1);
  }

  generateReport(data);
}

main().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

