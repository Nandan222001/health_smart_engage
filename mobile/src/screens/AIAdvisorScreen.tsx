import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { styled } from 'nativewind';
import { Colors, Spacing } from '../theme';
import { TopAppBar, IndustrialCard } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

const AIAdvisorScreen = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    { role: 'ai', text: 'Hello! I am your HSE Safety Advisor. How can I help you today?' },
  ]);

  const handleSend = () => {
    if (!query) return;
    setHistory([...history, { role: 'user', text: query }, { role: 'ai', text: 'Analyzing safety protocol... According to SOP #4.2, you should always wear eye protection in this zone.' }]);
    setQuery('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopAppBar title="AI Safety Advisor" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {history.map((h, i) => (
          <StyledView key={i} className={`p-4 rounded-lg max-w-[80%] ${h.role === 'ai' ? 'bg-[#edeef0] self-start' : 'bg-primary self-end'}`}>
            <StyledText className={h.role === 'ai' ? 'text-on-surface' : 'text-white'}>{h.text}</StyledText>
          </StyledView>
        ))}
      </ScrollView>
      <StyledView className="p-4 border-t-2 bg-white flex-row items-center" style={{ borderColor: Colors.outlineVariant, gap: 12 }}>
        <StyledTextInput 
          className="flex-1 h-12 bg-[#f3f4f6] px-4 rounded-lg"
          placeholder="Ask a safety question..."
          value={query}
          onChangeText={setQuery}
        />
        <StyledView className="w-12 h-12 bg-primary items-center justify-center rounded-lg">
          <StyledText className="text-white text-xl" onPress={handleSend}>➡️</StyledText>
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};

export default AIAdvisorScreen;
