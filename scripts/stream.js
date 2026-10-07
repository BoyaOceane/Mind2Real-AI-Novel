// Shared SSE reader: preserve events and UTF-8 characters across network chunks.
globalThis.JimoStream = {
    async read(response, onChunk) {
        if (!response.ok) {
            const labels = { 401: 'API Key 无效，请检查设置', 402: '账户余额不足', 429: '请求过于频繁，请稍后重试' };
            throw new Error(labels[response.status] || `服务暂不可用（${response.status}），请稍后重试`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '', content = '', reasoning = '', finished = false;
        function consume(line) {
            if (!line.startsWith('data:')) return;
            const data = line.slice(5).trim();
            if (!data) return;
            if (data === '[DONE]') { finished = true; return; }
            const packet = JSON.parse(data);
            if (packet.error) throw new Error('生成服务返回错误，请重试');
            const choice = packet.choices?.[0];
            if (choice?.finish_reason === 'stop') finished = true;
            const delta = choice?.delta;
            reasoning += delta?.reasoning_content || '';
            if (delta?.content) {
                content += delta.content;
                onChunk?.(content);
            }
            if (choice?.finish_reason === 'length') throw new Error('输出达到上限，已保留草稿');
        }
        try {
            while (true) {
                const { done, value } = await reader.read();
                buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
                let newline;
                while ((newline = buffer.indexOf('\n')) >= 0) {
                    consume(buffer.slice(0, newline).replace(/\r$/, ''));
                    buffer = buffer.slice(newline + 1);
                }
                if (done) break;
            }
            if (buffer.trim()) consume(buffer.trim());
            if (!finished) throw new Error('连接中断，已保留收到的内容');
            return { content, reasoning };
        } finally {
            reader.releaseLock();
        }
    }
};
