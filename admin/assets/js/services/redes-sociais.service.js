/**
 * Serviço de Redes Sociais
 * Gerencia links de redes sociais exibidos no rodapé
 */

const RedesSociaisService = {
  collection: 'redes_sociais',

  redesDisponiveis: {
    instagram: { nome: 'Instagram', icone: '📷', placeholder: 'https://instagram.com/seuperfil' },
    facebook: { nome: 'Facebook', icone: '📘', placeholder: 'https://facebook.com/suapagina' },
    tiktok: { nome: 'TikTok', icone: '🎵', placeholder: 'https://tiktok.com/@seuperfil' },
    twitter: { nome: 'Twitter/X', icone: '🐦', placeholder: 'https://twitter.com/seuperfil' },
    youtube: { nome: 'YouTube', icone: '📺', placeholder: 'https://youtube.com/@seucanal' },
    linkedin: { nome: 'LinkedIn', icone: '💼', placeholder: 'https://linkedin.com/company/suaempresa' },
    whatsapp: { nome: 'WhatsApp', icone: '💬', placeholder: 'https://wa.me/5511999999999' },
    pinterest: { nome: 'Pinterest', icone: '📌', placeholder: 'https://pinterest.com/seuperfil' }
  },

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const redes = [];
      snapshot.forEach(doc => {
        redes.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${redes.length} redes sociais encontradas`);
      return redes;
    } catch (error) {
      console.error('❌ Erro ao listar redes sociais:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar rede social:', error);
      return null;
    }
  },

  async criar(rede) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'rede_social', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar rede social' };
      }

      const novaRede = {
        tipo: rede.tipo,
        nome: this.redesDisponiveis[rede.tipo]?.nome || rede.nome,
        icone: this.redesDisponiveis[rede.tipo]?.icone || rede.icone,
        url: DomUtils.sanitizeUrl(rede.url),
        ordem: parseInt(rede.ordem) || 0,
        ativo: rede.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novaRede);
      console.info('✅ Rede social criada:', docRef.id);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar rede social:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'rede_social', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar rede social' };
      }

      const dadosAtualizados = {
        tipo: dados.tipo,
        nome: this.redesDisponiveis[dados.tipo]?.nome || dados.nome,
        icone: this.redesDisponiveis[dados.tipo]?.icone || dados.icone,
        url: DomUtils.sanitizeUrl(dados.url),
        ordem: parseInt(dados.ordem) || 0,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Rede social atualizada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar rede social:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'rede_social', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar rede social' };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Rede social deletada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar rede social:', error);
      return { success: false, error: error.message };
    }
  },

  async reordenar(redes) {
    try {
      const batch = firebaseDb.batch();

      redes.forEach(({ id, ordem }) => {
        const ref = firebaseDb.collection(this.collection).doc(id);
        batch.update(ref, { ordem: parseInt(ordem) });
      });

      await batch.commit();
      console.info('✅ Redes sociais reordenadas');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar redes sociais:', error);
      return { success: false, error: error.message };
    }
  },

  validar(rede) {
    const erros = [];

    if (!rede.tipo || rede.tipo.trim() === '') {
      erros.push('Tipo de rede social é obrigatório');
    }

    if (!rede.url || rede.url.trim() === '') {
      erros.push('URL é obrigatória');
    }

    if (rede.url && !this.validarUrl(rede.url)) {
      erros.push('URL inválida');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  validarUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

window.RedesSociaisService = RedesSociaisService;
