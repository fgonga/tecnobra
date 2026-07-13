/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */
type ErrorResponse = {
  titulo: string;
  mensagem: string;
  solucao: string;
};

class ErrorMessages {
  static generic(): string {
    return 'Tente mais tarde ou entre em contacto com o administrador do sistema.';
  }

  static get(status: number): ErrorResponse {
    const key = `e${status}` as keyof ErrorMessages;
    return typeof this[key] === "function"
      ? (this[key] as () => ErrorResponse)()
      : {
        titulo: 'Erro desconhecido',
        mensagem: '',
        solucao: this.generic()
      };
  }

  static e300(): ErrorResponse {
    return {
      titulo: '[300] Múltiplas escolhas',
      mensagem: 'Isso pode ocorrer quando houver várias extensões de tipo de arquivo disponíveis ou se o servidor estiver enfrentando desambiguação de sentido de palavra.',
      solucao: this.generic()
    };
  }

  static e301(): ErrorResponse {
    return {
      titulo: '[301] O recurso movido permanentemente',
      mensagem: 'Uma página Web ou recurso foi substituído permanentemente por um recurso diferente.',
      solucao: this.generic()
    };
  }

  static e302(): ErrorResponse {
    return {
      titulo: '[302] Ver Outros',
      mensagem: 'Encontramos o recurso solicitado. No entanto, o seu computador não conseguiu fazer a leitura apropriada.',
      solucao: this.generic()
    };
  }

  static e304(): ErrorResponse {
    return {
      titulo: '[304] O recurso solicitado não foi modificado',
      mensagem: 'O recurso solicitado já foi armazenado na memória do computador e não foi alterado.',
      solucao: this.generic()
    };
  }

  static e400(): ErrorResponse {
    return {
      titulo: '[400] Solicitação inválida',
      mensagem: 'O servidor não pode retornar uma resposta devido a um erro no cliente.',
      solucao: 'Tente verificar se todos os campos estão preenchidos corretamente e tente novamente.'
    };
  }

  static e401(): ErrorResponse {
    return {
      titulo: '[401] Não autorizado',
      mensagem: 'Você ou o seu grupo de utilizadores não tem autorização para visualizar este recurso.',
      solucao: 'Solicite ao administrador do sistema que lhe conceda a devida autorização.'
    };
  }

  static e403(): ErrorResponse {
    return {
      titulo: '[403] Acesso proibido',
      mensagem: 'Se insistir, seu acesso será bloqueado.',
      solucao: 'Se insistir, seu acesso será bloqueado.'
    };
  }

  static e404(): ErrorResponse {
    return {
      titulo: '[404] Recurso não encontrado',
      mensagem: 'O recurso solicitado não foi encontrado.',
      solucao: this.generic()
    };
  }

  static e422(): ErrorResponse {
    return {
      titulo: '[422] Credenciais informadas não correspondem com nossos Registos.',
      mensagem: 'Verifique as suas informações e tente novamente.',
      solucao: 'Tente novamente.'
    };
  }

  static e429(): ErrorResponse {
    return {
      titulo: '[429] Muitos pedidos.',
      mensagem: 'Enviou muitas solicitações em um determinado período de tempo.',
      solucao: 'Aguarde 1 minuto e tente novamente.'
    };
  }
}

export default ErrorMessages;
