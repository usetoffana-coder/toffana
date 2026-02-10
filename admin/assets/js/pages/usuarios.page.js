/**
 * Página: Usuários Admin
 */
const UsuariosPage = {
  init() {
    this.bindNovoUsuarioForm();
    this.carregarUsuarios();
  },

  bindNovoUsuarioForm() {
    const form = document.getElementById('novoUsuarioForm');
    if (!form) return;

    const emailInput = document.getElementById('novoUsuarioEmail');
    const nomeInput = document.getElementById('novoUsuarioNome');
    const roleSelect = document.getElementById('novoUsuarioRole');
    const ativoInput = document.getElementById('novoUsuarioAtivo');
    const mensagem = document.getElementById('novoUsuarioMensagem');
    const limparBtn = document.getElementById('novoUsuarioLimpar');

    const showMessage = (text, ok = true) => {
      if (!mensagem) return;
      mensagem.style.display = 'block';
      mensagem.textContent = text;
      mensagem.className = ok ? 'text-secondary' : 'text-danger';
    };

    const clearForm = () => {
      if (emailInput) emailInput.value = '';
      if (nomeInput) nomeInput.value = '';
      if (roleSelect) roleSelect.value = 'editor';
      if (ativoInput) ativoInput.checked = true;
      if (mensagem) mensagem.style.display = 'none';
    };

    if (limparBtn) {
      limparBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearForm();
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.UsersService) return;

      const email = emailInput ? emailInput.value.trim() : '';
      const displayName = nomeInput ? nomeInput.value.trim() : '';
      const role = roleSelect ? roleSelect.value : 'editor';
      const ativo = ativoInput ? ativoInput.checked : true;

      if (!email) {
        showMessage('Informe um email válido.', false);
        return;
      }

      const result = await UsersService.criar({ email, role, ativo, displayName });
      if (result.success) {
        showMessage('Usuário cadastrado com sucesso.');
        clearForm();
        await this.carregarUsuarios();
      } else {
        showMessage(result.error || 'Erro ao cadastrar usuário.', false);
      }
    });
  },

  async carregarUsuarios() {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;

    DomUtils.clear(tbody);

    const users = await UsersService.listar();

    if (users.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.textContent = 'Nenhum usuário encontrado.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const frag = document.createDocumentFragment();

    users.forEach(user => {
      const tr = document.createElement('tr');

      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email || user.id;

      const tdRole = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'select-periodo';
      ['admin', 'editor', 'analista'].forEach(role => {
        const opt = document.createElement('option');
        opt.value = role;
        opt.textContent = role;
        if (user.role === role) opt.selected = true;
        select.appendChild(opt);
      });
      tdRole.appendChild(select);

      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${user.ativo ? 'badge-active' : 'badge-inactive'}`;
      statusBadge.textContent = user.ativo ? 'Ativo' : 'Inativo';
      tdStatus.appendChild(statusBadge);

      const tdUpdated = document.createElement('td');
      const updated = user.atualizadoEm && typeof user.atualizadoEm.toDate === 'function'
        ? user.atualizadoEm.toDate().toLocaleString('pt-BR')
        : '-';
      tdUpdated.textContent = updated;

      const tdAcoes = document.createElement('td');
      const btnSalvar = document.createElement('button');
      btnSalvar.className = 'btn btn-primary';
      btnSalvar.textContent = 'Salvar';

      const btnToggle = document.createElement('button');
      btnToggle.className = 'btn btn-secondary';
      btnToggle.textContent = user.ativo ? 'Desativar' : 'Ativar';

      btnSalvar.addEventListener('click', async () => {
        const newRole = select.value;
        const result = await UsersService.atualizarRole(user.id, newRole);
        if (result.success) {
          if (window.AuditService) {
            await AuditService.log({
              action: 'user_role_update',
              entity: 'usuarios',
              entityId: user.id,
              before: { role: user.role },
              after: { role: newRole }
            });
          }
          user.role = newRole;
          alert('Perfil atualizado.');
        } else {
          alert('Erro ao atualizar perfil.');
        }
      });

      btnToggle.addEventListener('click', async () => {
        const next = !user.ativo;
        const result = await UsersService.atualizarAtivo(user.id, next);
        if (result.success) {
          if (window.AuditService) {
            await AuditService.log({
              action: 'user_status_update',
              entity: 'usuarios',
              entityId: user.id,
              before: { ativo: user.ativo },
              after: { ativo: next }
            });
          }
          user.ativo = next;
          statusBadge.className = `badge ${user.ativo ? 'badge-active' : 'badge-inactive'}`;
          statusBadge.textContent = user.ativo ? 'Ativo' : 'Inativo';
          btnToggle.textContent = user.ativo ? 'Desativar' : 'Ativar';
        } else {
          alert('Erro ao atualizar status.');
        }
      });

      tdAcoes.appendChild(btnSalvar);
      tdAcoes.appendChild(btnToggle);

      tr.appendChild(tdEmail);
      tr.appendChild(tdRole);
      tr.appendChild(tdStatus);
      tr.appendChild(tdUpdated);
      tr.appendChild(tdAcoes);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  }
};

document.addEventListener('DOMContentLoaded', () => UsuariosPage.init());
window.UsuariosPage = UsuariosPage;
